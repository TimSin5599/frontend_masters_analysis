import axios from 'axios';
import jwt from 'jsonwebtoken';
import React from 'react';

import { generatePasswordHash } from '../utils/hash';
import { mockUser } from './mock';

import config from '../../src/config';
import { showSnackbar } from '../components/Snackbar';
import { getToken, setToken, clearToken } from '../utils/tokenManager';

let UserStateContext = React.createContext();
let UserDispatchContext = React.createContext();

function userReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        ...action.payload,
      };
    case 'REGISTER_REQUEST':
    case 'RESET_REQUEST':
    case 'PASSWORD_RESET_EMAIL_REQUEST':
      return {
        ...state,
        isFetching: true,
        errorMessage: '',
      };
    case 'SIGN_OUT_SUCCESS':
      return { ...state };
    case 'AUTH_INIT_ERROR':
      return Object.assign({}, state, {
        currentUser: null,
        loadingInit: false,
      });
    case 'REGISTER_SUCCESS':
    case 'RESET_SUCCESS':
    case 'PASSWORD_RESET_EMAIL_SUCCESS':
      return Object.assign({}, state, {
        isFetching: false,
        errorMessage: '',
      });
    case 'AUTH_FAILURE':
      return Object.assign({}, state, {
        isFetching: false,
        errorMessage: action.payload,
      });
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function UserProvider({ children }) {
  let [state, dispatch] = React.useReducer(userReducer, {
    isAuthenticated: () => {
      return localStorage.getItem('isLoggedIn') === 'true';
    },
    isFetching: false,
    errorMessage: '',
    currentUser: (() => {
      try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
      } catch (e) {
        return null;
      }
    })(),
    loadingInit: true,
  });

  return (
    <UserStateContext.Provider value={state}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserStateContext.Provider>
  );
}

function useUserState() {
  let context = React.useContext(UserStateContext);
  if (context === undefined) {
    throw new Error('useUserState must be used within a UserProvider');
  }
  return context;
}

function useUserDispatch() {
  let context = React.useContext(UserDispatchContext);
  if (context === undefined) {
    throw new Error('useUserDispatch must be used within a UserProvider');
  }
  return context;
}

export { changeUserPassword, loginUser, signOut, updateUserProfile, UserProvider, useUserDispatch, useUserState };

// ###########################################################

function loginUser(
  dispatch,
  login,
  password,
  history,
  setIsLoading,
  setError,
  social = '',
) {
  setError(false);
  setIsLoading(true);
  // We check if app runs with backend mode
  if (!config.isBackend) {
    setError(null);
    doInit()(dispatch);
    setIsLoading(false);
    receiveToken('token', dispatch);
  } else {
    // Backend integration
    if (login.length > 0 && password.length > 0) {
      axios
        .post(`${config.baseURLApi}/v1/login`, { email: login, password })
        .then(async (res) => {
          const token = res.data.access_token;
          setError(null);
          setIsLoading(false);
          const hash = await generatePasswordHash(password);
          localStorage.setItem('cPwdH', hash);
          receiveToken(token, dispatch);
          doInit()(dispatch);
        })
        .catch(() => {
          setError(true);
          setIsLoading(false);
        });
    } else {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Login and password are required' });
    }
  }
}

export function sendPasswordResetEmail(email) {
  return (dispatch) => {
    if (!config.isBackend) {
      return;
    } else {
      dispatch({
        type: 'PASSWORD_RESET_EMAIL_REQUEST',
      });
      axios
        .post(`${config.baseURLApi}/v1/auth/send-password-reset-email`, { email })
        .then((res) => {
          dispatch({
            type: 'PASSWORD_RESET_EMAIL_SUCCESS',
          });
          showSnackbar({
            type: 'success',
            message: 'Email with resetting instructions has been sent',
          });
        })
        .catch((err) => {
          dispatch(authError(err.response.data));
        });
    }
  };
}

function signOut(dispatch, history) {
  localStorage.removeItem('user');
  localStorage.removeItem('user_id');
  localStorage.removeItem('cPwdH');
  localStorage.setItem('isLoggedIn', 'false');
  clearToken();
  axios.post(`${config.baseURLApi}/v1/logout`).catch(() => {});
  
  dispatch({ type: 'SIGN_OUT_SUCCESS' });
  history.push('/login');
}

export function receiveToken(token, dispatch) {
  let user = { email: 'unknown' };

  if (!config.isBackend) {
    user = { email: config.auth.email };
  }

  setToken(token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('theme', 'default');
  localStorage.setItem('isLoggedIn', 'true');
  
  dispatch({ type: 'LOGIN_SUCCESS' });
}

async function findMe() {
  if (config.isBackend) {
    const response = await axios.get(`${config.baseURLApi}/v1/auth/me`);
    return response.data;
  } else {
    return mockUser;
  }
}

export function authError(payload) {
  return {
    type: 'AUTH_FAILURE',
    payload,
  };
}

export function doInit() {
  return async (dispatch) => {
    let currentUser = null;
    if (!config.isBackend) {
      currentUser = mockUser;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          currentUser,
        },
      });
    } else {
      try {
        const res = await axios.post(`${config.baseURLApi}/v1/refresh`);
        setToken(res.data.access_token);
        
        currentUser = await findMe();
        
        if (currentUser && currentUser.id) {
          sessionStorage.setItem('user_id', currentUser.id);
        }
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { currentUser },
        });
      } catch (error) {
        console.log("No refresh token or session expired");
        dispatch({
          type: 'AUTH_INIT_ERROR',
          payload: error,
        });
      }
    }
  };
}

export function registerUser(
  dispatch,
  login,
  password,
  history,
  setIsLoading,
  setError,
  social = '',
) {
  return () => {
    if (!config.isBackend) {
      history.push('/login');
    } else {
      dispatch({
        type: 'REGISTER_REQUEST',
      });
      if (login.length > 0 && password.length > 0) {
        const payload = { email: login, password, role: 'user' };
        console.log("Register payload:", payload);
        axios
          .post(`${config.baseURLApi}/v1/register`, payload)
          .then((res) => {
            dispatch({
              type: 'REGISTER_SUCCESS',
            });
            showSnackbar({
              type: 'success',
              message:
                "You've been registered successfully. Please check your email for verification link",
            });

            // history.push('/login');
          })
          .catch((err) => {
            dispatch(authError(err.response.data));
          });
      } else {
        dispatch(authError('Something was wrong. Try again'));
      }
    }
  };
}

export function verifyEmail(token, history) {
  return (dispatch) => {
    if (!config.isBackend) {
      history.push('/login');
    } else {
      axios
        .put(`${config.baseURLApi}/v1/auth/verify-email`, { token })
        .then((verified) => {
          if (verified) {
            showSnackbar({
              type: 'success',
              message: 'Your email was verified',
            });
          }
        })
        .catch((err) => {
          showSnackbar({ type: 'error', message: err.response });
        })
        .finally(() => {
          history.push('/login');
        });
    }
  };
}

export function resetPassword(token, password, history) {
  return (dispatch) => {
    if (!config.isBackend) {
      history.push('/login');
    } else {
      dispatch({
        type: 'RESET_REQUEST',
      });
      axios
        .put(`${config.baseURLApi}/v1/auth/password-reset`, { token, password })
        .then((res) => {
          dispatch({
            type: 'RESET_SUCCESS',
          });
          showSnackbar({
            type: 'success',
            message: 'Password has been updated',
          });
          history.push('/login');
        })
        .catch((err) => {
          dispatch(authError(err.response.data));
        });
    }
  };
}
async function updateUserProfile(dispatch, userData) {
  if (!config.isBackend) return;

  try {
    const userId = sessionStorage.getItem('user_id');
    await axios.put(`${config.baseURLApi}/v1/users/${userId}`, userData);

    // Refresh user data
    const updatedUser = await findMe();
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { currentUser: updatedUser },
    });

    showSnackbar({ type: 'success', message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    showSnackbar({ type: 'error', message: 'Failed to update profile' });
  }
}

async function changeUserPassword(oldPassword, newPassword) {
  if (!config.isBackend) return;

  try {
    await axios.post(`${config.baseURLApi}/v1/auth/change-password`, { oldPassword, newPassword });
    showSnackbar({ type: 'success', message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    const msg = error.response?.data?.error || 'Failed to change password';
    showSnackbar({ type: 'error', message: msg });
    throw error;
  }
}
