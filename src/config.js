const isDev = process.env.NODE_ENV === "development";
const host = window.location.hostname || "localhost";

// В разработке (локально) ходим напрямую на порты, в продакшене — через NGINX
const baseURLApi = isDev ? `http://${host}:8101` : `/api/auth`;
const manageApi = isDev ? `http://${host}:8102` : `/api/manage`;
const statsApi = isDev ? `http://${host}:8103` : `/api/stats`;

export default {
  baseURLApi,
  manageApi,
  statsApi,
  isBackend: true,
  auth: {
    email: 'admin@masters.com',
    password: 'password',
  },
  app: {
    colors: {
      dark: '#002B49',
      light: '#FFFFFF',
      sea: '#004472',
      sky: '#E9EBEF',
      wave: '#D1E7F6',
      rain: '#CCDDE9',
      middle: '#D7DFE6',
      black: '#13191D',
      salat: '#21AE8C',
    },
  },
};
