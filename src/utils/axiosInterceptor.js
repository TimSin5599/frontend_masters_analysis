import axios from 'axios';
import { getToken, setToken, clearToken } from './tokenManager';
import config from '../config';

const setupAxiosInterceptors = (store) => {
  axios.defaults.withCredentials = true;

  // Interceptor для добавления Bearer токена к каждому запросу
  axios.interceptors.request.use(
    (req) => {
      const token = getToken();
      if (token) {
        req.headers['Authorization'] = `Bearer ${token}`;
      }
      return req;
    },
    (error) => Promise.reject(error)
  );

  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    failedQueue = [];
  };

  // Interceptor для обработки 401 ошибки и автоматического refresh токена
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    async (err) => {
      const originalRequest = err.config;

      // Если запрос был на /login или /refresh, и мы получили ошибку, просто прокидываем её дальше
      if (originalRequest.url?.includes('/v1/login') || originalRequest.url?.includes('/v1/refresh')) {
        return Promise.reject(err);
      }

      if (err.response && err.response.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise(function(resolve, reject) {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return axios(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Вызываем refresh токен. Куки (refresh) уйдут автоматически
          const res = await axios.post('/v1/refresh');
          const newAccessToken = res.data.access_token;
          
          setToken(newAccessToken);
          
          // Обновляем заголовок исходного запроса
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
          
          processQueue(null, newAccessToken);
          
          // Повторяем исходный запрос с новым токеном
          return axios(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearToken();
          
          // Диспатчим экшен разлогина или перенаправляем на логин
          store.dispatch({ type: 'LOGOUT_SUCCESS' });
          if (window.location.hash !== '#/login') {
             window.location.href = '#/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(err);
    }
  );
};

export default setupAxiosInterceptors;
