import { createTheme } from '@mui/material/styles';

export const DRAWER_WIDTH = 240;

export const theme = createTheme({
  palette: {
    primary: {
      main: '#002855',
      light: '#1A4A7A',
      dark: '#001B3D',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64BE28',
      light: '#7ED348',
      dark: '#4A9A1E',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#F39200',
      light: '#F5A833',
      dark: '#C47600',
    },
    background: {
      default: '#F5F5F5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"FSEmeric", Arial, Helvetica, sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        containedSecondary: {
          '&:hover': { backgroundColor: '#7ED348' },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#002855',
        },
      },
    },
  },
});
