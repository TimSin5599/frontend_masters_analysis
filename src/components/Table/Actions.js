import React from 'react';
import { useHistory } from 'react-router-dom';

import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const Actions = ({ id, openModal, entity }) => {
  const history = useHistory();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          borderRadius: 1,
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 180,
            borderRadius: 2,
            mt: 0.5,
            overflow: 'visible',
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              boxShadow: '-1px -1px 2px rgba(0,0,0,0.08)',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            history.push(`/app/${entity}/${id}/edit`);
            handleClose();
          }}
          sx={{
            py: 1.2,
            px: 2,
            gap: 1.5,
            '&:hover': { backgroundColor: 'primary.light', color: 'primary.contrastText',
              '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main' }}>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Редактировать" primaryTypographyProps={{ fontSize: 14 }} />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={(event) => {
            openModal(event, id);
            handleClose();
          }}
          sx={{
            py: 1.2,
            px: 2,
            gap: 1.5,
            '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText',
              '& .MuiListItemIcon-root': { color: 'error.contrastText' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 'auto', color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Удалить" primaryTypographyProps={{ fontSize: 14 }} />
        </MenuItem>
      </Menu>
    </div>
  );
};

export default Actions;
