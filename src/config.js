const host = window.location.hostname || "localhost";
const hostApi = process.env.NODE_ENV === "development"
  ? `http://${host}`
  : "https://sing-generator-node.herokuapp.com";
const portApi = process.env.NODE_ENV === "development" ? 8080 : "";
const baseURLApi = `http://${host}:8081`;
const manageApi = `http://${host}:8080`;
const statsApi = `http://${host}:8083`;

export default {
  baseURLApi,
  manageApi,
  statsApi,
  isBackend: true,
  auth: {
    email: 'admin@flatlogic.com',
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
