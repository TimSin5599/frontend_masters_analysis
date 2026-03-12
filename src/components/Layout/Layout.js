import SettingsIcon from '@mui/icons-material/Settings';
import { Fab } from '@mui/material';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Route, Switch, withRouter } from 'react-router-dom';

// styles
import useStyles from './styles';

// components
import Header from '../Header';
import ColorChangeThemePopper from './components/ColorChangeThemePopper';

// pages
import AddApplicant from '../../pages/applicants/AddApplicant';
import Applicants from '../../pages/applicants/Applicants';
import ApplicantDetails from '../../pages/applicants/details/ApplicantDetails';
import UsersFormPage from '../../pages/CRUD/Users/form/UsersFormPage';
import UsersTable from '../../pages/CRUD/Users/table/UsersTable';
import Dashboard from '../../pages/dashboard';
import Programs from '../../pages/programs/Programs';
import EditUser from '../../pages/user/EditUser';

// context
import { useLayoutState } from '../../context/LayoutContext';

//Sidebar structure (Not used in Layout anymore)
// import structure from '../Sidebar/SidebarStructure';

const Redirect = (props) => {
  useEffect(() => window.location.replace(props.url));
  return <span>Redirecting...</span>;
};

function Layout(props) {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const open = Boolean(anchorEl);
  const id = open ? 'add-section-popover' : undefined;
  const handleClick = (event) => {
    setAnchorEl(open ? null : event.currentTarget);
  };

  // global
  let layoutState = useLayoutState();

  return (
    <div className={classes.root}>
      <Header history={props.history} />
      <div className={classes.content}>
        <div className={classes.fakeToolbar} />
        <div style={{ padding: '8px 8px' }}>
          <Switch>
            <Route path='/app/dashboard' component={Dashboard} />
            <Route path='/app/programs' exact component={Programs} />
            <Route path='/app/programs/current' exact render={(props) => <Programs {...props} defaultView="current" />} />
            <Route path='/app/programs/archive' exact render={(props) => <Programs {...props} defaultView="archive" />} />
            <Route path='/app/programs/:programId/applicants' exact component={Applicants} />
            <Route path='/app/applicants' exact component={Applicants} />
            <Route path='/app/applicants/new' exact component={AddApplicant} />
            <Route path='/app/applicants/:id' component={ApplicantDetails} />
            <Route path='/app/users' exact component={UsersTable} />
            <Route path='/app/user/new' exact component={UsersFormPage} />
            <Route path='/app/users/:id/edit' exact component={UsersFormPage} />
            <Route path="/app/profile" component={EditUser} />
          </Switch>
        </div>
        <Fab
          color='primary'
          aria-label='settings'
          onClick={(e) => handleClick(e)}
          className={classes.changeThemeFab}
          style={{ zIndex: 100 }}
        >
          <SettingsIcon style={{ color: '#fff' }} />
        </Fab>
        <ColorChangeThemePopper id={id} open={open} anchorEl={anchorEl} />
      </div>
    </div>
  );
}

export default withRouter(connect()(Layout));
