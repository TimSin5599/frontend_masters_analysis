import { doInit } from 'actions/auth';
import axios from 'axios';
import Errors from 'components/FormItems/error/errors';
import { push } from 'connected-react-router';
import { showSnackbar } from '../../components/Snackbar';
import config from '../../config';

const actions = {
  doNew: () => {
    return {
      type: 'USERS_FORM_RESET',
    };
  },

  doFind: (id) => async (dispatch) => {
    try {
      dispatch({
        type: 'USERS_FORM_FIND_STARTED',
      });

      axios.get(`${config.baseURLApi}/v1/users/${id}`).then((res) => {
        const record = res.data;

        dispatch({
          type: 'USERS_FORM_FIND_SUCCESS',
          payload: record,
        });
      });
    } catch (error) {
      Errors.handle(error);

      dispatch({
        type: 'USERS_FORM_FIND_ERROR',
      });

      dispatch(push('/admin/users'));
    }
  },

  doCreate: (values) => async (dispatch) => {
    try {
      dispatch({
        type: 'USERS_FORM_CREATE_STARTED',
      });

      axios.post(`${config.baseURLApi}/v1/users`, values).then((res) => {
        dispatch({
          type: 'USERS_FORM_CREATE_SUCCESS',
        });
        showSnackbar({ type: 'success', message: 'Users created' });
        dispatch(push('/app/users'));
      });
    } catch (error) {
      Errors.handle(error);

      dispatch({
        type: 'USERS_FORM_CREATE_ERROR',
      });
    }
  },

  doUpdate: (id, values, isProfile) => async (dispatch, getState) => {
    try {
      dispatch({
        type: 'USERS_FORM_UPDATE_STARTED',
      });

      await axios.put(`${config.baseURLApi}/v1/users/${id}`, values);

      dispatch(doInit());

      dispatch({
        type: 'USERS_FORM_UPDATE_SUCCESS',
      });

      if (isProfile) {
        showSnackbar({ type: 'success', message: 'Profile updated' });
      } else {
        showSnackbar({ type: 'success', message: 'Users updated' });
        dispatch(push('/admin/users'));
      }
    } catch (error) {
      Errors.handle(error);

      dispatch({
        type: 'USERS_FORM_UPDATE_ERROR',
      });
    }
  },
};

export default actions;
