import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dot from './Dot';

const theme = createTheme();

describe('Dot Component', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Dot />
      </ThemeProvider>
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies the correct inline color style', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Dot color="red" />
      </ThemeProvider>
    );
    // Since it falls back to raw color string when theme.palette.text.red is not found
    expect(container.firstChild).toHaveStyle('background-color: red');
  });
});
