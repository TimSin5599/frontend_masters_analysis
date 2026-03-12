import {
  AppBar as AppBarBase,
  Avatar as AvatarBase,
  Badge as BadgeBase,
  Button as ButtonBase,
  Chip as ChipBase,
  CircularProgress as CircularProgressBase,
  LinearProgress as LinearProgressBase,
  Link as LinkBase,
  Paper as PaperBase,
  Radio as RadioBase,
  Tooltip as TooltipBase,
  Typography as TypographyBase,
  useTheme,
} from '@mui/material';
import { makeStyles, withStyles } from '@mui/styles';
import classnames from 'classnames';

// styles
const useStyles = makeStyles((theme) => ({
  badge: {
    fontWeight: 600,
    height: (props) => {
      if (!props.variant) return 16;
    },
    minWidth: (props) => {
      if (!props.variant) return 16;
    },
  },
}));

function Badge({ children, colorBrightness, color, type, ...props }) {
  const classes = useStyles(props);
  const theme = useTheme();
  const Styled = createStyled({
    badge: {
      backgroundColor:
        type === 'tag'
          ? `${getColor(color, theme, colorBrightness)}44`
          : getColor(color, theme, colorBrightness),
      color: type === 'tag' ? getColor(color, theme, colorBrightness) : 'white',
      borderRadius: type === 'tag' && 4,
      padding: type === 'tag' && '6px 6px',
      height: type === 'tag' && 'auto',
      position: type === 'tag' && 'static',
      transform: type === 'tag' && 'none',
      marginRight: type === 'tag' && 10,
      marginBottom: type === 'tag' && 10,
      alignContent: 'center',
    },
  });

  return (
    <Styled>
      {(styledProps) => (
        <BadgeBase
          classes={{
            badge: classnames(classes.badge, styledProps.classes.badge),
          }}
          {...props}
        >
          {children}
        </BadgeBase>
      )}
    </Styled>
  );
}

function Chip({ colorBrightness, color, variant, ...props }) {
  const theme = useTheme();
  const Styled = createStyled({
    root: {
      backgroundColor: getColor(color, theme, colorBrightness),
      color: 'white',
    },
  });

  return (
    <Styled>
      {(styledProps) => (
        <ChipBase
          classes={{
            root: classnames(styledProps.classes.root),
          }}
          {...props}
        />
      )}
    </Styled>
  );
}

function Typography({
  children,
  weight,
  size,
  colorBrightness,
  color,
  block,
  uppercase,
  style,
  ...props
}) {
  const theme = useTheme();

  return (
    <TypographyBase
      style={{
        color: getColor(color, theme, colorBrightness),
        fontWeight: getFontWeight(weight),
        fontSize: getFontSize(size, props.variant, theme),
        textTransform: uppercase ? 'uppercase' : 'none',
        ...style,
      }}
      component={block ? 'div' : 'p'}
      {...props}
    >
      {children}
    </TypographyBase>
  );
}

function Button({ children, color, className, style, variant, ...props }) {
  const useStyles = makeStyles((theme) => ({
    root: {
      color: getColor(color, theme),
      textTransform: 'none',
      fontWeight: 500,
    },
    contained: {
      backgroundColor: getColor(color, theme),
      boxShadow: theme.customShadows.widget,
      color:
        theme.palette.type === 'dark' && !color
          ? '#000'
          : `${color ? 'white' : theme.palette.text.primary} !important`,
      '&:hover': {
        backgroundColor: getColor(color, theme, 'light'),
        boxShadow: theme.customShadows.widgetWide,
      },
      '&:active': {
        boxShadow: theme.customShadows.widgetWide,
      },
    },
    outlined: {
      color: `${getColor(color, theme)} !important`,
      borderColor: `${getColor(color, theme)} !important`,
      '&:hover': {
        backgroundColor: `${getColor(color, theme)}11`, // Subtle background on hover
      }
    },
    select: {
      backgroundColor: theme.palette.primary.main,
      color: '#fff',
    },
  }));
  const classes = useStyles();

  return (
    <ButtonBase
      classes={{
        root: classes.root,
      }}
      {...props}
      className={classnames(
        classes.root,
        {
          [classes.select]: props.select,
          [classes.contained]: variant === 'contained',
          [classes.outlined]: variant === 'outlined',
        },
        className,
      )}
      style={{ ...style }}
    >
      {children}
    </ButtonBase>
  );
}

function Avatar({ children, color, colorBrightness, ...props }) {
  const theme = useTheme();

  const Styled = createStyled({
    colorDefault: {
      backgroundColor: getColor(color, theme, colorBrightness),
    },
  });

  return (
    <Styled>
      {({ classes }) => (
        <AvatarBase classes={{ colorDefault: classes.colorDefault }} {...props}>
          {children}
        </AvatarBase>
      )}
    </Styled>
  );
}

function Tooltip({ children, color, ...props }) {
  const theme = useTheme();

  const Styled = createStyled({
    tooltip: {
      backgroundColor: getColor(color, theme),
      color: 'white',
    },
  });

  return (
    <Styled>
      {({ classes }) => (
        <TooltipBase classes={{ tooltip: classes.tooltip }} {...props}>
          {children}
        </TooltipBase>
      )}
    </Styled>
  );
}

function Paper({ children, color, ...props }) {
  const theme = useTheme();

  const Styled = createStyled({
    root: {
      backgroundColor: getColor(color, theme),
    },
  });

  return (
    <Styled>
      {({ classes }) => (
        <PaperBase classes={{ root: classes.root }} {...props}>
          {children}
        </PaperBase>
      )}
    </Styled>
  );
}

function AppBar({ children, color, ...props }) {
  const useStyles = makeStyles((theme) => ({
    root: {
      backgroundColor: getColor(color, theme),
    },
  }));

  const classes = useStyles();

  return (
    <AppBarBase classes={{ root: classes.root }} {...props}>
      {children}
    </AppBarBase>
  );
}

function Link({ children, color, ...props }) {
  const useStyles = makeStyles((theme) => ({
    root: {
      color: color
        ? `${getColor(color, theme)} !important`
        : theme.palette.text.primary,
      textDecoration: 'none',
    },
  }));

  const classes = useStyles();

  return (
    <LinkBase classes={{ root: classes.root }} {...props}>
      {children}
    </LinkBase>
  );
}

function CircularProgress({ children, color, ...props }) {
  const useStyles = makeStyles((theme) => ({
    root: {
      color: color
        ? `${getColor(color, theme)} !important`
        : theme.palette.primary.main,
    },
  }));

  const classes = useStyles();

  return (
    <CircularProgressBase classes={{ root: classes.root }} {...props}>
      {children}
    </CircularProgressBase>
  );
}

function LinearProgress({ children, color, ...props }) {
  const theme = useTheme();

  const Styled = createStyled({
    root: {
      backgroundColor: getCustomBackgroundColor(color),
    },
    bar: {
      backgroundColor: color
        ? `${getColor(color, theme)} !important`
        : theme.palette.primary.main,
    },
  });

  return (
    <Styled>
      {({ classes }) => (
        <LinearProgressBase
          classes={{ root: classes.root, bar: classes.bar }}
          {...props}
        >
          {children}
        </LinearProgressBase>
      )}
    </Styled>
  );
}

function Radio({ children, color, ...props }) {
  const Styled = createStyled({
    root: {
      color: 'green',
      '&$checked': {
        color: 'green',
      },
    },
    checked: {},
  });

  return (
    <Styled>
      {({ classes }) => (
        <RadioBase
          classes={{
            root: classes.root,
            checked: classes.checked,
          }}
          {...props}
        />
      )}
    </Styled>
  );
}

export {
  AppBar, Avatar, Badge, Button,
  Chip, CircularProgress,
  LinearProgress, Link, Paper, Radio, Tooltip, Typography
};

// ########################################################################

function getColor(color, theme, brightness = 'main') {
  if (color === 'inherit') {
    return 'inherit';
  }
  if (color && theme.palette[color] && theme.palette[color][brightness]) {
    return theme.palette[color][brightness];
  }
}

function getCustomBackgroundColor(color) {
  switch (color) {
    case 'primary':
      return 'rgba(83, 109, 254, .3)';
    case 'secondary':
      return 'rgba(255, 198, 208, 0.3)';
    case 'warning':
      return 'rgba(255, 219, 198, 0.3)';
    case 'success':
      return 'rgba(147, 212, 185, 0.3)';
    case 'info':
      return 'rgba(214, 172, 254, 0.3)';
    default:
      return '#C4D4FE';
  }
}

function getFontWeight(style) {
  switch (style) {
    case 'light':
      return 300;
    case 'medium':
      return 500;
    case 'bold':
      return 600;
    default:
      return 400;
  }
}

function getFontSize(size, variant = '', theme) {
  let multiplier;

  switch (size) {
    case 'sm':
      multiplier = 0.8;
      break;
    case 'md':
      multiplier = 1.5;
      break;
    case 'xl':
      multiplier = 2;
      break;
    case 'xxl':
      multiplier = 3;
      break;
    default:
      multiplier = 1;
      break;
  }

  const defaultSize =
    variant && theme.typography[variant]
      ? theme.typography[variant].fontSize
      : theme.typography.fontStyle + 'px';

  return `calc(${defaultSize} * ${multiplier})`;
}

function createStyled(styles, options) {
  const Styled = function (props) {
    const { children, ...other } = props;
    return children(other);
  };

  return withStyles(styles, options)(Styled);
}
