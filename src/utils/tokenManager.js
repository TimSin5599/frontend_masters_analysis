let _accessToken = null;

export const getToken = () => _accessToken;

export const setToken = (token) => {
  _accessToken = token;
};

export const clearToken = () => {
  _accessToken = null;
};
