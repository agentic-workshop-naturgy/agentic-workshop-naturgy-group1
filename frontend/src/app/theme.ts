import { createTheme } from '@mui/material/styles';

export const DRAWER_WIDTH = 240;

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1a2744',
      light: '#2e3f6e',
      dark: '#0d1526',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00a650',
      light: '#4fc87f',
      dark: '#007835',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f6fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
  },
});
