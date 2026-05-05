import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import Loader from 'components/Loader';
import { Formik } from 'formik';
import { useEffect, useState } from 'react';

import InputFormItem from 'components/FormItems/items/InputFormItem';

import FormValidations from 'components/FormItems/formValidations';
import IniValues from 'components/FormItems/iniValues';
import PreparedValues from 'components/FormItems/preparedValues';
import Widget from 'components/Widget';
import usersFields from 'pages/CRUD/Users/helpers/usersFields';

const ROLE_OPTIONS = usersFields.roles.options;

const RolesCheckboxGroup = ({ form, disabled }) => {
  const selected = Array.isArray(form.values.roles) ? form.values.roles : [];
  const error = (form.touched.roles || form.submitCount > 0) && form.errors.roles;

  const toggle = (value) => {
    const next = selected.includes(value)
      ? selected.filter((r) => r !== value)
      : [...selected, value];
    form.setFieldValue('roles', next);
    form.setFieldTouched('roles');
  };

  return (
    <FormControl component="fieldset" disabled={disabled} error={!!error}>
      <FormLabel component="legend" sx={{ color: error ? 'error.main' : undefined }}>
        Роли *
      </FormLabel>
      <FormGroup row>
        {ROLE_OPTIONS.map((opt) => (
          <FormControlLabel
            key={opt.value}
            label={opt.label}
            control={
              <Checkbox
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                color={error ? 'error' : 'primary'}
              />
            }
          />
        ))}
      </FormGroup>
      {!!error && (
        <FormHelperText>{error}</FormHelperText>
      )}
    </FormControl>
  );
};

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
    if (!Array.isArray(values.roles)) {
      values.roles = [];
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
    if (isProfile) return 'Редактировать профиль';
    return isEditing ? 'Редактировать пользователя' : 'Добавить пользователя';
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
                <InputFormItem name={'firstName'} schema={usersFields} autoFocus disabled={isReadOnly} />
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

              {!isEditing && !isProfile && (
                <Grid item>
                  <InputFormItem name={'password'} schema={usersFields} disabled={isReadOnly} type="text" />
                </Grid>
              )}

              <Grid item>
                <RolesCheckboxGroup form={form} disabled={isReadOnly} />
              </Grid>
            </Grid>

            <Grid container spacing={3} mt={2}>
              {isReadOnly ? (
                <Grid item>
                  <Button color='primary' variant='contained' onClick={() => setIsReadOnly(false)}>
                    Изменить
                  </Button>
                </Grid>
              ) : (
                <>
                  <Grid item>
                    <Button color='primary' variant='contained' onClick={form.handleSubmit}>
                      Сохранить
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button color='primary' variant='outlined' onClick={form.handleReset}>
                      Сбросить
                    </Button>
                  </Grid>
                </>
              )}
              <Grid item>
                <Button color='primary' variant='outlined' onClick={() => onCancel()}>
                  Отмена
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </Widget>
  );

  if (findLoading) return <Loader />;
  if (isEditing && !record) return <Loader />;
  return renderForm();
};

export default UsersForm;
