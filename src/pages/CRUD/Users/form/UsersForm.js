import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Loader from 'components/Loader';
import { Formik } from 'formik';
import { useEffect, useState } from 'react';

import ImagesFormItem from 'components/FormItems/items/ImagesFormItem';
import InputFormItem from 'components/FormItems/items/InputFormItem';
import RadioFormItem from 'components/FormItems/items/RadioFormItem';

import FormValidations from 'components/FormItems/formValidations';
import IniValues from 'components/FormItems/iniValues';
import PreparedValues from 'components/FormItems/preparedValues';
import Widget from 'components/Widget';
import usersFields from 'pages/CRUD/Users/helpers/usersFields';

const UsersForm = (props) => {
  const {
    isEditing,
    isProfile,
    findLoading,
    record,
    onSubmit,
    onCancel,
  } = props;

  const [isReadOnly, setIsReadOnly] = useState(isEditing || isProfile);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    if (!isEditing && !isProfile) {
      // Generate a random 10-character password for new users
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let pass = '';
      for (let i = 0; i < 10; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setGeneratedPassword(pass);
    }
  }, [isEditing, isProfile]);

  const iniValues = () => {
    const values = IniValues(usersFields, record || {});
    if (!isEditing && !isProfile && generatedPassword) {
      values.password = generatedPassword;
    }
    return values;
  };

  const formValidations = () => {
    return FormValidations(usersFields, record || {});
  };

  const handleSubmit = (values) => {
    const { id, ...data } = PreparedValues(usersFields, values || {});
    onSubmit(id, data);
  };

  const title = () => {
    if (isProfile) {
      return 'Edit My Profile';
    }

    return isEditing ? 'Edit Users' : 'Add Users';
  };

  const renderForm = () => (
    <Widget title={title()} collapse close>
      <Formik
        onSubmit={handleSubmit}
        initialValues={iniValues()}
        validationSchema={formValidations()}
      >
        {(form) => (
          <form onSubmit={form.handleSubmit}>
            <Grid container spacing={3} direction='column'>
              <Grid item>
                <InputFormItem
                  name={'firstName'}
                  schema={usersFields}
                  autoFocus
                  disabled={isReadOnly}
                />
              </Grid>

              <Grid item>
                <InputFormItem name={'lastName'} schema={usersFields} disabled={isReadOnly} />
              </Grid>

              <Grid item>
                <InputFormItem name={'phoneNumber'} schema={usersFields} disabled={isReadOnly} />
              </Grid>

              <Grid item>
                <InputFormItem name={'email'} schema={usersFields} disabled={isReadOnly} />
              </Grid>

              <Grid item>
                <InputFormItem name={'password'} schema={usersFields} disabled={isReadOnly} type="text" />
              </Grid>

              <Grid item>
                <RadioFormItem name={'role'} schema={usersFields} disabled={isReadOnly} />
              </Grid>

              <Grid item>
                <ImagesFormItem
                  name={'avatar'}
                  schema={usersFields}
                  path={'users/avatar'}
                  fileProps={{
                    size: undefined,
                    formats: undefined,
                  }}
                  max={undefined}
                  disabled={isReadOnly}
                />
              </Grid>


            </Grid>
            <Grid container spacing={3} mt={2}>
              {isReadOnly ? (
                <Grid item>
                  <Button
                    color='primary'
                    variant='contained'
                    onClick={() => setIsReadOnly(false)}
                  >
                    Изменить
                  </Button>
                </Grid>
              ) : (
                <>
                  <Grid item>
                    <Button
                      color='primary'
                      variant='contained'
                      onClick={form.handleSubmit}
                    >
                      Save
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      color='primary'
                      variant='outlined'
                      onClick={form.handleReset}
                    >
                      Reset
                    </Button>
                  </Grid>
                </>
              )}
              <Grid item>
                <Button
                  color='primary'
                  variant='outlined'
                  onClick={() => onCancel()}
                >
                  Cancel
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </Widget>
  );
  if (findLoading) {
    return <Loader />;
  }
  if (isEditing && !record) {
    return <Loader />;
  }
  return renderForm();
};
export default UsersForm;
