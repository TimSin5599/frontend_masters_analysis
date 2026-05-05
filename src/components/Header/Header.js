import {
  Person as AccountIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import { AppBar, Menu, MenuItem, Toolbar, useTheme } from '@mui/material';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// images
import config from '../../config';

// structure
import structure from '../Sidebar/SidebarStructure';

// styles
import useStyles from './styles';

// components
import { Typography } from '../Wrappers/Wrappers';

// context
import {
  useLayoutDispatch,
} from '../../context/LayoutContext';
import {
  useManagementDispatch,
  useManagementState,
} from '../../context/ManagementContext';

import { actions } from '../../context/ManagementContext';
import { signOut, useUserDispatch } from '../../context/UserContext';
import { hasRole } from '../../utils/roles';

export default function Header(props) {
  let classes = useStyles();
  let theme = useTheme();

  // global
  let layoutDispatch = useLayoutDispatch();
  let userDispatch = useUserDispatch();
  const managementDispatch = useManagementDispatch();

  // local
  const [profileMenu, setProfileMenu] = useState(null);
  const [programsMenu, setProgramsMenu] = useState(null);
  const [currentUser, setCurrentUser] = useState();

  const managementValue = useManagementState();

  useEffect(() => {
    actions.doFind(sessionStorage.getItem('user_id'))(managementDispatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config.isBackend) {
      setCurrentUser(managementValue.currentUser);
    }
  }, [managementValue]);

  useEffect(function () {
    window.addEventListener('resize', handleWindowWidthChange);
    handleWindowWidthChange();
    return function cleanup() {
      window.removeEventListener('resize', handleWindowWidthChange);
    };
  });

  function handleWindowWidthChange() {
    let windowWidth = window.innerWidth;
    let breakpointWidth = theme.breakpoints.values.md;
    let isSmallScreen = windowWidth < breakpointWidth;
  }

  return (
    <AppBar position='fixed' className={classes.appBar}>
      <Toolbar className={classes.toolbar}>
        <Typography variant='h6' weight='medium' className={classes.logotype}>
          Master's Analysis
        </Typography>

        {/* Horizontal Navigation Links */}
        <div className={classes.navContainer} style={{ marginLeft: 'auto' }}>
          {structure.map((item) => {
            if (item.label === 'Пользователи' && !hasRole(currentUser, 'admin')) {
              return null;
            }
            if (item.children) {
              return (
                <div key={item.id} className={classes.navItemWrapper}>
                  <div
                    className={classes.navLink}
                    aria-controls='programs-menu'
                    aria-haspopup='true'
                    onClick={(e) => setProgramsMenu(e.currentTarget)}
                  >
                    <span className={classes.navIcon}>{item.icon}</span>
                    <Typography variant='h6' className={classes.navText}>
                      {item.label}
                    </Typography>
                  </div>
                  <Menu
                    id='programs-menu'
                    anchorEl={programsMenu}
                    open={Boolean(programsMenu)}
                    onClose={() => setProgramsMenu(null)}
                    classes={{ paper: classes.profileMenu }}
                    disableAutoFocusItem
                  >
                    {item.children.map((child) => (
                      <MenuItem
                        key={child.label}
                        onClick={() => setProgramsMenu(null)}
                        className={classes.headerMenuItem}
                      >
                        <Link to={child.link} className={classes.dropdownLink}>
                          <span className={classes.dropdownIcon}>{child.icon}</span>
                          <Typography variant='body1'>{child.label}</Typography>
                        </Link>
                      </MenuItem>
                    ))}
                  </Menu>
                </div>
              );
            }
            return (
              <div key={item.id} className={classes.navItemWrapper}>
                <Link to={item.link} className={classes.navLink}>
                  <span className={classes.navIcon}>{item.icon}</span>
                  <Typography variant='h6' className={classes.navText}>
                    {item.label}
                  </Typography>
                </Link>
              </div>
            );
          })}
        </div>

        {/* <div className={classes.grow} /> */}

        <div
          className={classes.navLink}
          aria-controls='profile-menu'
          aria-haspopup='true'
          onClick={(e) => setProfileMenu(e.currentTarget)}
          style={{ paddingRight: 16 }}
        >
          <span className={classes.navIcon}><AccountIcon /></span>
          <Typography variant='h6' className={classes.navText}>
            Профиль
          </Typography>
        </div>

        <Menu
          id='profile-menu'
          open={Boolean(profileMenu)}
          anchorEl={profileMenu}
          onClose={() => setProfileMenu(null)}
          className={classes.headerMenu}
          classes={{ paper: classes.profileMenu }}
          disableAutoFocusItem
        >
          <div className={classes.profileMenuUser}>
            <Typography variant='h4' weight='medium'>
              {currentUser?.firstName}
            </Typography>
          </div>
          <MenuItem
            className={classNames(
              classes.profileMenuItem,
              classes.headerMenuItem,
            )}
          >
            <AccountIcon className={classes.profileMenuIcon} />
            <Link to='/app/profile' style={{ textDecoration: 'none' }}>
              Профиль
            </Link>
          </MenuItem>
          <MenuItem
            className={classNames(
              classes.profileMenuItem,
              classes.headerMenuItem,
            )}
            onClick={() => signOut(userDispatch, props.history)}
          >
            <ExitToAppIcon className={classes.profileMenuIcon} />
            <Typography
              className={classes.profileMenuLink}
              color='primary'
            >
              Выйти
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
