
// styles
import { Button } from '../Wrappers';
import useStyles from './styles';

// components
import { Box } from '@mui/material';
import { Typography } from '../Wrappers';

export default function PageTitle(props) {
  let classes = useStyles();

  return (
    <div className={props.dense ? classes.pageTitleContainerDense : classes.pageTitleContainer}>
      <Typography className={classes.typo} variant='h1' size='sm'>
        {props.title}
      </Typography>
      <Box display="flex" alignItems="center">
        {props.actions && props.actions}
        {props.button && (
          <Button
            className={classes.button}
            variant='contained'
            size='large'
            color='primary'
            onClick={props.onClick}
            style={{ marginLeft: props.actions ? 10 : 0 }}
          >
            {props.button}
          </Button>
        )}
      </Box>
    </div>
  );
}
