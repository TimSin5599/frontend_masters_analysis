import { Box, Grid, TextField } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import { useHistory, useLocation } from 'react-router-dom';
import useStyles from './styles';

import {
  Lock as LockIcon,
  PersonOutline as PersonOutlineIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

import { Button, IconButton, InputAdornment, Typography } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Widget from '../../components/Widget';

import {
  useManagementDispatch,
  useManagementState,
} from '../../context/ManagementContext';

import { showSnackbar } from '../../components/Snackbar';
import { actions } from '../../context/ManagementContext';
import { generatePasswordHash } from '../../utils/hash';

const EditUser = () => {
  const classes = useStyles();
  const [tab, setTab] = React.useState(0);
  const [password, setPassword] = React.useState({
    newPassword: '',
    confirmPassword: '',
    currentPassword: '',
  });
  const [data, setData] = React.useState(null);
  const [editable, setEditable] = React.useState(false);
  const [passError, setPassError] = React.useState({ confirm: false, current: false });
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Click handlers for toggling visibility
  const handleClickShowCurrentPassword = () => setShowCurrentPassword((show) => !show);
  const handleClickShowNewPassword = () => setShowNewPassword((show) => !show);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  let { id } = useParams();
  const fileInput = React.useRef(null);
  const handleChangeTab = (event, newValue) => {
    setTab(newValue);
  };
  const location = useLocation();
  const managementDispatch = useManagementDispatch();
  const managementValue = useManagementState();

  const history = useHistory();

  useEffect(() => {
    const userId = id || sessionStorage.getItem('user_id');
    actions.doFind(userId)(managementDispatch);
    // eslint-disable-next-line  react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (location.pathname.includes('edit') || location.pathname.includes('profile')) {
      setEditable(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    setData(managementValue.currentUser);
  }, [managementDispatch, managementValue, id]);

  function handleSubmit() {
    const userId = id || sessionStorage.getItem('user_id');
    actions.doUpdate(
      userId,
      data,
      history,
    )(managementDispatch);
    showSnackbar({ type: 'success', message: 'Данные пользователя обновлены' });
  }

  async function handleUpdatePassword() {
    setPassError({ confirm: false, current: false });
    if (password.newPassword !== password.confirmPassword) {
      setPassError(prev => ({ ...prev, confirm: true }));
      return;
    }
    if (!password.currentPassword || !password.newPassword) {
      return; // Basic safeguard
    }

    try {
      await actions.doChangePassword(password)(managementDispatch);
      setPassword({ newPassword: '', confirmPassword: '', currentPassword: '' }); // Clear fields on success
    } catch (err) {
      setPassError(prev => ({ ...prev, current: true }));
    }
  }

  function handleChangePassword(e) {
    const newPassData = {
      ...password,
      [e.target.name]: e.target.value,
    };
    setPassword(newPassData);
    setPassError({ confirm: false, current: false });
  }

  useEffect(() => {
    // Only run validation if at least one field is filled
    if (!password.newPassword && !password.confirmPassword && !password.currentPassword) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      let errors = { confirm: false, current: false };

      // Password mismatch check
      if (password.newPassword && password.confirmPassword && password.newPassword !== password.confirmPassword) {
        errors.confirm = true;
      }

      // Current password hash check
      if (password.currentPassword) {
        const typedHash = await generatePasswordHash(password.currentPassword);
        const storedHash = localStorage.getItem('cPwdH');
        if (storedHash && typedHash !== storedHash) {
          errors.current = true;
        }
      }

      if (errors.confirm || errors.current) {
        setPassError(errors);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [password]);

  function handleChange(e) {
    const { name, value } = e.target;
    setData({
      ...data,
      [name]: value,
    });
  }

  return (
    <Grid container spacing={3} justifyContent="center">
      <Grid item xs={12} md={8}>
        <Widget>
          <Box display={'flex'} justifyContent={'center'}>
            <Tabs
              indicatorColor='primary'
              textColor='primary'
              value={tab}
              onChange={handleChangeTab}
              aria-label='full width tabs example'
            >
              <Tab
                label='ПРОФИЛЬ'
                icon={<PersonOutlineIcon />}
                classes={{ wrapper: classes.icon }}
              />
              <Tab
                label='ИЗМЕНИТЬ ПАРОЛЬ'
                icon={<LockIcon />}
                classes={{ wrapper: classes.icon }}
              />
            </Tabs>
          </Box>
        </Widget>
      </Grid>
      <Grid item xs={12} md={8} lg={6}>
        <Widget>
          <Grid item justifyContent={'center'} container>
            <Box display={'flex'} flexDirection={'column'} width={'100%'}>
              {tab === 0 ? (
                <>
                  <Typography
                    variant={'h5'}
                    weight={'medium'}
                    style={{ marginBottom: 35, marginTop: 15 }}
                  >
                    Личная информация
                  </Typography>
                  <TextField
                    label='Имя'
                    variant='outlined'
                    defaultValue='Имя'
                    value={data && data.firstName}
                    name='firstName'
                    onChange={handleChange}
                    style={{ marginBottom: 35 }}
                  />
                  <TextField
                    label='Фамилия'
                    variant='outlined'
                    defaultValue={'Фамилия'}
                    value={data && data.lastName}
                    name='lastName'
                    onChange={handleChange}
                    style={{ marginBottom: 35 }}
                  />
                  <TextField
                    label='Телефон'
                    variant='outlined'
                    style={{ marginBottom: 35 }}
                    defaultValue={'1-555-666-7070'}
                    value={data && data.phone}
                    name='phone'
                    onChange={handleChange}
                  />
                  <TextField
                    label='Email'
                    variant='outlined'
                    style={{ marginBottom: 35 }}
                    type={'email'}
                    defaultValue={'Jane@gmail.com'}
                    value={data && data.email}
                    name='email'
                    onChange={handleChange}
                    disabled
                  />
                </>
              ) : tab === 1 ? (
                <>
                  <Typography
                    variant={'h5'}
                    weight={'medium'}
                    style={{ marginBottom: 35, marginTop: 15 }}
                  >
                    Пароль
                  </Typography>
                  <TextField
                    label='Текущий пароль'
                    type={showCurrentPassword ? 'text' : 'password'}
                    variant='outlined'
                    style={{ marginBottom: 35 }}
                    defaultValue={'Текущий пароль'}
                    value={password.currentPassword || ''}
                    name='currentPassword'
                    onChange={handleChangePassword}
                    error={passError.current}
                    helperText={passError.current ? 'Неверный текущий пароль' : ''}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowCurrentPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showCurrentPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label='Новый пароль'
                    type={showNewPassword ? 'text' : 'password'}
                    variant='outlined'
                    style={{ marginBottom: 35 }}
                    defaultValue={'Новый пароль'}
                    value={password.newPassword || ''}
                    name='newPassword'
                    onChange={handleChangePassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowNewPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showNewPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label='Подтвердите пароль'
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant='outlined'
                    style={{ marginBottom: 35 }}
                    defaultValue={'Подтвердите пароль'}
                    value={password.confirmPassword || ''}
                    name='confirmPassword'
                    onChange={handleChangePassword}
                    error={passError.confirm}
                    helperText={passError.confirm ? 'Новый пароль не совпадает' : ''}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowConfirmPassword}
                            onMouseDown={handleMouseDownPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </>
              ) : (
                <>
                  <Typography
                    variant={'h5'}
                    weight={'medium'}
                    style={{ marginBottom: 35 }}
                  >
                    Настройки
                  </Typography>
                  <FormControl variant='outlined' style={{ marginBottom: 35 }}>
                    <Select
                      labelId='demo-simple-select-outlined-label'
                      id='demo-simple-select-outlined'
                      value={10}
                    >
                      <MenuItem value={10}>Русский</MenuItem>
                      <MenuItem value={20}>Администратор</MenuItem>
                      <MenuItem value={30}>Суперадминистратор</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography weight={'bold'}>Коммуникации:</Typography>
                  <Box display={'flex'}>
                    <FormControlLabel
                      control={
                        <Checkbox checked name='checkedB' color='secondary' />
                      }
                      label='Email'
                    />
                    <FormControlLabel
                      control={<Checkbox name='checkedB' color='secondary' />}
                      label='Сообщения'
                    />
                    <FormControlLabel
                      control={<Checkbox name='checkedB' color='secondary' />}
                      label='Телефон'
                    />
                  </Box>
                  <Box display={'flex'} mt={2} alignItems={'center'}>
                    <Typography weight={'medium'}>
                      Email-уведомления
                    </Typography>
                    <Switch color={'primary'} checked />
                  </Box>
                  <Box display={'flex'} mt={2} mb={2} alignItems={'center'}>
                    <Typography weight={'medium'}>
                      Отправлять копию на личный email
                    </Typography>
                    <Switch color={'primary'} />
                  </Box>
                </>
              )}
              {editable && (
                <Box display={'flex'} justifyContent={'flex-end'}>
                  {tab !== 1 ? (
                    <>
                      <Button variant={'outlined'} onClick={handleSubmit}>
                        Сохранить
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant={'outlined'}
                        onClick={handleUpdatePassword}
                      >
                        Сохранить пароль
                      </Button>
                    </>
                  )}
                </Box>
              )}
            </Box>
          </Grid>
        </Widget>
      </Grid>
    </Grid>
  );
};

export default EditUser;
