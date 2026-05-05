import {
  CircularProgress,
  Grid,
  Grow,
  TextField as Input,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';

// styles
import useStyles from './styles';

// logo
import logo from './logo_HSE.svg';


// context
import {
  doInit,
  loginUser,
  receiveToken,
  registerUser,
  sendPasswordResetEmail,
  useUserDispatch,
} from '../../context/UserContext';

//components
import Widget from '../../components/Widget';
import { Button } from '../../components/Wrappers';
import config from '../../config';

const getGreeting = () => {
  const d = new Date();
  if (d.getHours() >= 4 && d.getHours() <= 12) {
    return 'Доброе утро';
  } else if (d.getHours() >= 13 && d.getHours() <= 16) {
    return 'Добрый день';
  } else if (d.getHours() >= 17 && d.getHours() <= 23) {
    return 'Добрый вечер';
  } else {
    return 'Доброй ночи';
  }
};

function Login(props) {
  let classes = useStyles();
  const tab = new URLSearchParams(props.location.search).get('tab');

  // global
  let userDispatch = useUserDispatch();

  useEffect(() => {
    const params = new URLSearchParams(props.location.search);
    const token = params.get('token');
    if (token) {
      receiveToken(token, userDispatch);
      doInit()(userDispatch);
    }
  }, []); // eslint-disable-line

  // local
  let [isLoading, setIsLoading] = useState(false);
  let [error, setError] = useState(null);
  let [activeTabId, setActiveTabId] = useState(+tab ?? 0);
  let [nameValue, setNameValue] = useState('');
  let [loginValue, setLoginValue] = useState('');
  let [passwordValue, setPasswordValue] = useState('');
  let [forgotEmail, setForgotEmail] = useState('');
  let [isForgot, setIsForgot] = useState(false);

  let isLoginFormValid = () => {
    return loginValue.length !== 0 && passwordValue.length !== 0;
  };

  let loginOnEnterKey = (event) => {
    if (event.key === 'Enter' && isLoginFormValid()) {
      loginUser(
        userDispatch,
        loginValue,
        passwordValue,
        props.history,
        setIsLoading,
        setError,
      );
    }
  };

  return (
    <Grid container className={classes.container}>
      <div className={classes.logotypeContainer}>
        <img src={logo} alt='logo' className={classes.logotypeImage} />
        <Typography sx={{ fontSize: '3rem', textAlign: 'center', color: 'white' }}>
            Система интеллектуального анализа портфолио абитуриентов для приёма в магистратуру
        </Typography>
      </div>
      <div
        className={
          !isForgot ? classes.formContainer : classes.customFormContainer
        }
      >
        <div className={classes.form}>
          {isForgot ? (
            <>
              <div className={classes.topSection}>
                <div className={classes.greetingWrapper}>
                  <Typography variant='h1' className={classes.greeting}>
                    Forgot Password
                  </Typography>
                </div>
              </div>
              <div className={classes.centerSection}>
                <Input
                  id='password'
                  InputProps={{
                    classes: {
                      underline: classes.InputUnderline,
                      input: classes.Input,
                    },
                  }}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  margin='normal'
                  placeholder='Email'
                  type='Email'
                  fullWidth
                />
                <div className={classes.formButtons}>
                  {isLoading ? (
                    <CircularProgress size={26} className={classes.loginLoader} />
                  ) : (
                    <Button
                      disabled={forgotEmail.length === 0}
                      onClick={() =>
                        sendPasswordResetEmail(forgotEmail)(userDispatch)
                      }
                      variant='contained'
                      color='primary'
                      size='large'
                    >
                      Send
                    </Button>
                  )}
                  <Button
                    color='primary'
                    size='large'
                    onClick={() => setIsForgot(!isForgot)}
                    className={classes.forgetButton}
                  >
                    Back to login
                  </Button>
                </div>
              </div>
              <div className={classes.bottomSection} />
            </>
          ) : (
            <>
              <Tabs
                value={activeTabId}
                onChange={(e, id) => setActiveTabId(id)}
                indicatorColor='primary'
                textColor='primary'
                centered
              >
                <Tab label='Login' classes={{ root: classes.tab }} />
              </Tabs>
              {activeTabId === 0 && (
                <React.Fragment>
                  <div className={classes.topSection}>
                    {/* {config.isBackend ? (
                      <Widget
                        disableWidgetMenu
                        inheritHeight
                      >
                        <Typography
                          variant={'body2'}
                          component="div"
                          style={{ textAlign: 'center' }}
                        >
                          This is a real app with Node.js backend - use
                          <Typography variant={'body2'} weight={'bold'}>
                            "admin@flatlogic.com / password"
                          </Typography>{' '}
                          to login!
                        </Typography>
                      </Widget>
                    ) : null} */}
                    <div className={classes.greetingWrapper}>
                      <Typography variant='h1' className={classes.greeting}>
                        {getGreeting()}!
                      </Typography>
                    </div>
                  </div>
                  <div className={classes.centerSection}>
                    <Grow
                      in={error}
                      style={
                        !error ? { display: 'none' } : { display: 'inline-block' }
                      }
                    >
                      <Typography className={classes.errorMessage}>
                        Логин или пароль введены некорректно
                      </Typography>
                    </Grow>
                    <Input
                      id='email'
                      InputProps={{
                        classes: {
                          underline: classes.InputUnderline,
                          input: classes.Input,
                        },
                      }}
                      value={loginValue}
                      onChange={(e) => setLoginValue(e.target.value)}
                      margin='normal'
                      placeholder='Email Adress'
                      type='email'
                      fullWidth
                      onKeyDown={(e) => loginOnEnterKey(e)}
                    />
                    <Input
                      id='password'
                      InputProps={{
                        classes: {
                          underline: classes.InputUnderline,
                          input: classes.Input,
                        },
                      }}
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      margin='normal'
                      placeholder='Password'
                      type='password'
                      fullWidth
                      onKeyDown={(e) => loginOnEnterKey(e)}
                    />
                    <div className={classes.formButtons}>
                      {isLoading ? (
                        <CircularProgress
                          size={26}
                          className={classes.loginLoader}
                        />
                      ) : (
                        <Button
                          disabled={!isLoginFormValid()}
                          onClick={() =>
                            loginUser(
                              userDispatch,
                              loginValue,
                              passwordValue,
                              props.history,
                              setIsLoading,
                              setError,
                            )
                          }
                          variant='contained'
                          color='primary'
                          size='large'
                        >
                          Войти
                        </Button>
                      )}
                      <Button
                        color='primary'
                        size='large'
                        onClick={() => setIsForgot(!isForgot)}
                        className={classes.forgetButton}
                      >
                        Забыли пароль?
                      </Button>
                    </div>
                  </div>
                  <div className={classes.bottomSection} />
                </React.Fragment>
              )}
              {activeTabId === 1 && (
                <React.Fragment>
                  <div className={classes.topSection}>
                    <div className={classes.greetingWrapper}>
                      <Typography variant='h1' className={classes.greeting}>
                        Welcome!
                      </Typography>
                      <Typography variant='h2' className={classes.subGreeting}>
                        Create your account
                      </Typography>
                    </div>
                  </div>
                  <div className={classes.centerSection}>
                    <Grow in={error}>
                      <Typography className={classes.errorMessage}>
                        Something is wrong with your login or password :(
                      </Typography>
                    </Grow>
                    <Input
                      id='name'
                      InputProps={{
                        classes: {
                          underline: classes.InputUnderline,
                          input: classes.Input,
                        },
                      }}
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      margin='normal'
                      placeholder='Full Name'
                      type='email'
                      fullWidth
                    />
                    <Input
                      id='email'
                      InputProps={{
                        classes: {
                          underline: classes.InputUnderline,
                          input: classes.Input,
                        },
                      }}
                      value={loginValue}
                      onChange={(e) => setLoginValue(e.target.value)}
                      margin='normal'
                      placeholder='Email Adress'
                      type='email'
                      fullWidth
                    />
                    <Input
                      id='password'
                      InputProps={{
                        classes: {
                          underline: classes.InputUnderline,
                          input: classes.Input,
                        },
                      }}
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      margin='normal'
                      placeholder='Password'
                      type='password'
                      fullWidth
                    />
                    <div className={classes.creatingButtonContainer}>
                      {isLoading ? (
                        <CircularProgress size={26} />
                      ) : (
                        <Button
                          onClick={() =>
                            registerUser(
                              userDispatch,
                              loginValue,
                              passwordValue,
                              props.history,
                              setIsLoading,
                              setError,
                            )()
                          }
                          disabled={
                            loginValue.length === 0 ||
                            passwordValue.length === 0 ||
                            nameValue.length === 0
                          }
                          size='large'
                          variant='contained'
                          color='primary'
                          fullWidth
                          className={classes.createAccountButton}
                        >
                          Create your account
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className={classes.bottomSection} />

                </React.Fragment>
              )}
            </>
          )}
        </div>
        {/* <Typography color='primary' className={classes.copyright}>
          2014-{new Date().getFullYear()}{' '}
          <a
            style={{ textDecoration: 'none', color: 'inherit' }}
            href='https://flatlogic.com'
            rel='noopener noreferrer'
            target='_blank'
          >
            Flatlogic
          </a>
          , LLC. All rights reserved.
        </Typography> */}
      </div>
    </Grid >
  );
}

export default withRouter(Login);
