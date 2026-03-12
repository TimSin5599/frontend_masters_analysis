import * as dataFormat from 'pages/CRUD/Users/table/UsersDataFormatters';

import actions from 'actions/users/usersListActions';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { Link } from 'react-router-dom';

import { makeStyles } from '@mui/styles';
import { DataGrid } from '@mui/x-data-grid';


import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Button } from 'components/Wrappers/Wrappers';

import Widget from 'components/Widget';
import Dialog from '../../../../components/Dialog';
import Actions from '../../../../components/Table/Actions';
import ExpertSlotsManager from '../../../../pages/user/ExpertSlotsManager';

const useStyles = makeStyles({
  container: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 10,
    '& a': {
      textDecoration: 'none',
      color: '#fff',
    },
  },
});

const UsersTable = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const classes = useStyles();
  // eslint-disable-next-line no-unused-vars
  const [width, setWidth] = React.useState(window.innerWidth);
  const [activeTab, setActiveTab] = React.useState(0);

  const [loading, setLoading] = React.useState(false);
  const [sortModel, setSortModel] = React.useState([]);
  const [selectionModel, setSelectionModel] = React.useState([]);
  // eslint-disable-next-line no-unused-vars
  const count = useSelector((store) => store.users.list.count);
  const modalOpen = useSelector((store) => store.users.list.modalOpen);
  const rows = useSelector((store) => store.users.list.rows);
  const idToDelete = useSelector((store) => store.users.list.idToDelete);

  const [rowsState, setRowsState] = React.useState({
    page: 0,
    pageSize: 5,
  });

  const loadData = async (limit, page, orderBy) => {
    setLoading(true);
    await dispatch(actions.doFetch({ limit, page, orderBy, request: '' }));
    setLoading(false);
  };

  React.useEffect(() => {
    loadData(rowsState.pageSize, rowsState.page, sortModel[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortModel, rowsState]);

  React.useEffect(() => {
    updateWindowDimensions();
    window.addEventListener('resize', updateWindowDimensions);
    return () => window.removeEventListener('resize', updateWindowDimensions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSortModelChange = (newModel) => {
    setSortModel(newModel);
  };

  const updateWindowDimensions = () => {
    setWidth(window.innerWidth);
  };

  const handleDelete = () => {
    dispatch(
      actions.doDelete({ limit: 10, page: 0, request: '' }, idToDelete),
    );
  };

  const openModal = (event, cell) => {
    const id = cell;
    event.stopPropagation();
    dispatch(actions.doOpenConfirm(id));
  };

  const closeModal = () => {
    dispatch(actions.doCloseConfirm());
  };

  function NoRowsOverlay() {
    return (
      <Stack height='100%' alignItems='center' justifyContent='center'>
        Ничего не найдено
      </Stack>
    );
  }

  const columns = [
    {
      field: 'firstName',

      flex: 0.6,

      headerName: 'Имя',
    },

    {
      field: 'lastName',

      flex: 0.6,

      headerName: 'Фамилия',
    },

    {
      field: 'phoneNumber',

      flex: 0.6,

      headerName: 'Телефон',
    },

    {
      field: 'email',

      flex: 0.6,

      headerName: 'E-Mail',
    },

    {
      field: 'role',

      headerName: 'Роль',
    },

    {
      field: 'lastOnline',

      renderCell: (params) => dataFormat.dateTimeFormatter(params.row.lastOnline),

      headerName: 'Был в сети',
    },

    {
      field: 'avatar',

      sortable: false,
      renderCell: (params) => dataFormat.imageFormatter(params.row),

      headerName: 'Аватар',
    },

    {
      field: 'id',
      headerName: 'Действия',
      sortable: false,
      flex: 0.6,
      maxWidth: 80,
      renderCell: (params) => (
        <Actions
          classes={classes}
          entity='users'
          openModal={openModal}
          {...params}
        />
      ),
    },
  ];

  return (
    <div>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Список пользователей" />
          <Tab label="Управление экспертами" />
        </Tabs>
      </Box>

      {activeTab === 0 ? (
        <Widget
          title='Пользователи'
          disableWidgetMenu
          actions={
            <Link to='/app/user/new' style={{ textDecoration: 'none' }}>
              <Button variant='contained' color="primary">Добавить пользователя</Button>
            </Link>
          }
        >

          <div
            style={{
              minHeight: 500,
              width: '100%',
              paddingTop: 20,
              paddingBottom: 20,
            }}
          >
            <DataGrid
              rows={loading ? [] : rows}
              columns={columns}
              sortingMode='server'
              sortModel={sortModel}
              onSortModelChange={handleSortModelChange}
              rowsPerPageOptions={[5, 10, 20, 50, 100]}
              pageSize={5}
              pagination
              {...rowsState}
              paginationMode='server'
              components={{ NoRowsOverlay, LoadingOverlay: LinearProgress }}
              onPageChange={(page) => {
                setRowsState((prev) => ({ ...prev, page }));
              }}
              onPageSizeChange={(pageSize) => {
                setRowsState((prev) => ({ ...prev, pageSize }));
              }}
              onSelectionModelChange={(newSelectionModel) => {
                setSelectionModel(newSelectionModel);
              }}
              selectionModel={selectionModel}
              checkboxSelection
              disableSelectionOnClick
              disableColumnMenu
              loading={loading}
              onRowClick={(e) => {
                history.push(`/app/users/${e.id}/edit`);
              }}
              autoHeight
            />
          </div>
        </Widget>
      ) : (
        <Widget title="Управление экспертами" disableWidgetMenu>
          <ExpertSlotsManager />
        </Widget>
      )}

      <Dialog
        open={modalOpen || false}
        title='Подтверждение удаления'
        contentText='Вы уверены, что хотите удалить этого пользователя?'
        onClose={closeModal}
        onSubmit={handleDelete}
      />
    </div>
  );
};

export default UsersTable;
