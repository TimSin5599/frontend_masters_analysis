// Всегда используем относительные пути — в dev через setupProxy.js, в prod через nginx
const baseURLApi = `/api/auth`;
const manageApi = `/api/manage`;
const statsApi = `/api/stats`;

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
