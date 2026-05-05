import React from 'react';
import PropTypes from 'prop-types';
import FormErrors from 'components/FormItems/formErrors';
import { FastField } from 'formik';
import TextField from '@mui/material/TextField';

const InputFormItem = (props) => {
  const {
    name,
    schema,
    hint,
    placeholder,
    autoFocus,
    autoComplete,
    inputProps,
    errorMessage,
    multiline,
    disabled,
    type,
  } = props;

  const { label } = schema[name];

  return (
    <FastField name={name}>
      {({ form }) => {
        const errorText = FormErrors.displayableError(form, name, errorMessage);
        return (
          <>
            <TextField
              id={`field-${name}`}
              variant='outlined'
              fullWidth
              label={label}
              type={type || 'text'}
              multiline={multiline}
              rows={multiline && 4}
              disabled={disabled}
              onChange={(event) => {
                form.setFieldValue(name, event.target.value);
                form.setFieldTouched(name);
              }}
              value={form.values[name] || ''}
              placeholder={placeholder || undefined}
              autoFocus={autoFocus || undefined}
              autoComplete={autoComplete || undefined}
              error={!!errorText}
              helperText={errorText || undefined}
              {...inputProps}
            />
            {!!hint && <small className='form-text text-muted'>{hint}</small>}
          </>
        );
      }}
    </FastField>
  );
};

InputFormItem.propTypes = {
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  type: PropTypes.string,
  hint: PropTypes.string,
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.string,
  prefix: PropTypes.string,
  placeholder: PropTypes.string,
  errorMessage: PropTypes.string,
  inputProps: PropTypes.object,
};

export default InputFormItem;
