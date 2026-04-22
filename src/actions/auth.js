import axios from 'axios';
import Errors from 'components/FormItems/error/errors';
import { push } from 'connected-react-router';
import { showSnackbar } from '../components/Snackbar';
import config from '../config';
import { clearToken, setToken } from '../utils/tokenManager';

export const AUTH_FAILURE = 'AUTH_FAILURE';
export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGOUT_REQUEST = 'LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';
export const RESET_REQUEST = 'RESET_REQUEST';
export const RESET_SUCCESS = 'RESET_SUCCESS';
export const PASSWORD_RESET_EMAIL_REQUEST = 'PASSWORD_RESET_EMAIL_REQUEST';
export const PASSWORD_RESET_EMAIL_SUCCESS = 'PASSWORD_RESET_EMAIL_SUCCESS';
export const AUTH_INIT_SUCCESS = 'AUTH_INIT_SUCCESS';
export const AUTH_INIT_ERROR = 'AUTH_INIT_ERROR';
export const REGISTER_REQUEST = 'REGISTER_REQUEST';
export const REGISTER_SUCCESS = 'REGISTER_SUCCESS';

async function findMe() {
  const response = await axios.get(`${config.baseURLApi}/v1/auth/me`);
  return response.data;
}

export function authError(payload) {
  return {
    type: AUTH_FAILURE,
    payload,
  };
}

export function doInit() {
  return async (dispatch) => {
    try {
      let currentUser = null;
      try {
        const res = await axios.post('/v1/refresh');
        setToken(res.data.access_token);
        currentUser = await findMe();
      } catch (err) {
        // Если cookie нет или она истекла — ничего страшного, пользователь просто не залогинен
        console.log('No refresh token found or expired');
      }

      dispatch({
        type: AUTH_INIT_SUCCESS,
        payload: {
          currentUser,
        },
      });
    } catch (error) {
      Errors.handle(error);

      dispatch({
        type: AUTH_INIT_ERROR,
        payload: error,
      });
    }
  };
}

export function logoutUser() {
  return async (dispatch) => {
    dispatch({ type: LOGOUT_REQUEST });

    try {
      await axios.post('/v1/logout');
    } catch (err) {
      console.log('Logout API error:', err);
    }

    clearToken();
    localStorage.setItem('isLoggedIn', 'false');
    dispatch({ type: LOGOUT_SUCCESS });
    dispatch(push('/login'));
  };
}

export function receiveToken(token) {
  return (dispatch) => {
    setToken(token);
    localStorage.setItem('isLoggedIn', 'true');
    dispatch({ type: LOGIN_SUCCESS });
  };
}

export function loginUser(creds) {
  return (dispatch) => {
    dispatch({
      type: LOGIN_REQUEST,
    });
    if (creds.social) {
      window.location.href = config.baseURLApi + '/auth/signin/' + creds.social;
    } else if (creds.email.length > 0 && creds.password.length > 0) {
      axios
        .post(`${config.baseURLApi}/v1/login`, creds)
        .then((res) => {
          const token = res.data.access_token;
          dispatch(receiveToken(token));
          dispatch(doInit());
          dispatch(push('/app'));
        })
        .catch((err) => {
          dispatch(authError(err.response.data));
        });
    } else {
      dispatch(authError('Something was wrong. Try again'));
    }
  };
}

export function verifyEmail(token) {
  return (dispatch) => {
    axios
      .put('/auth/verify-email', { token })
      .then((verified) => {
        if (verified) {
          showSnackbar({ type: 'success', message: 'Your email was verified' });
        }
      })
      .catch((err) => {
        showSnackbar({ type: 'error', message: err.response.data });
      })
      .finally(() => {
        dispatch(push('/login'));
      });
  };
}

export function resetPassword(token, password) {
  return (dispatch) => {
    dispatch({
      type: RESET_REQUEST,
    });
    axios
      .put('/auth/password-reset', { token, password })
      .then((res) => {
        dispatch({
          type: RESET_SUCCESS,
        });
        showSnackbar({ type: 'success', message: 'Password has been updated' });
        dispatch(push('/login'));
      })
      .catch((err) => {
        dispatch(authError(err.response.data));
      });
  };
}

export function sendPasswordResetEmail(email) {
  return (dispatch) => {
    dispatch({
      type: PASSWORD_RESET_EMAIL_REQUEST,
    });
    axios
      .post('/auth/send-password-reset-email', { email })
      .then((res) => {
        dispatch({
          type: PASSWORD_RESET_EMAIL_SUCCESS,
        });
        showSnackbar({
          type: 'success',
          message: 'Email with resetting instructions has been sent',
        });
        dispatch(push('/login'));
      })
      .catch((err) => {
        dispatch(authError(err.response.data));
      });
  };
}

export function registerUser(creds) {
  return (dispatch) => {
    dispatch({
      type: REGISTER_REQUEST,
    });

    if (creds.email.length > 0 && creds.password.length > 0) {
      axios
        .post(`${config.baseURLApi}/v1/register`, creds)
        .then((res) => {
          dispatch({
            type: REGISTER_SUCCESS,
          });
          showSnackbar({
            type: 'success',
            message:
              "You've been registered successfully. Please check your email for verification link",
          });
          dispatch(push('/login'));
        })
        .catch((err) => {
          dispatch(authError(err.response.data));
        });
    } else {
      dispatch(authError('Something was wrong. Try again'));
    }
  };
}
