import { createTheme } from '@mui/material/styles';

export const DRAWER_WIDTH = 260;

// Naturgy corporate colors (source: www.naturgy.es)
export const NATURGY = {
  orange: '#F5831F',
  orangeLight: '#FF9E1B',
  orangeDark: '#D96D0F',
  blue: '#003B5C',
  blueLight: '#1B5E87',
  blueDark: '#002840',
  white: '#FFFFFF',
  grayLight: '#F4F6F8',
  grayMid: '#E0E4E8',
  grayText: '#5A6872',
  grayDark: '#2D3436',
} as const;

export const theme = createTheme({
  palette: {
    primary: {
      main: NATURGY.orange,
      light: NATURGY.orangeLight,
      dark: NATURGY.orangeDark,
      contrastText: NATURGY.white,
    },
    secondary: {
      main: NATURGY.blue,
      light: NATURGY.blueLight,
      dark: NATURGY.blueDark,
      contrastText: NATURGY.white,
    },
    background: {
      default: NATURGY.grayLight,
      paper: NATURGY.white,
    },
    text: {
      primary: NATURGY.blue,
      secondary: NATURGY.grayText,
    },
    success: { main: '#2E7D32' },
    error: { main: '#D32F2F' },
    warning: { main: NATURGY.orange },
    info: { main: NATURGY.blueLight },
    divider: NATURGY.grayMid,
  },
  typography: {
    fontFamily: '"Open Sans", "Helvetica Neue", "Arial", sans-serif',
    h1: { fontWeight: 700, color: NATURGY.blue },
    h2: { fontWeight: 700, color: NATURGY.blue },
    h3: { fontWeight: 600, color: NATURGY.blue },
    h4: { fontWeight: 600, color: NATURGY.blue, fontSize: '1.5rem' },
    h5: { fontWeight: 600, color: NATURGY.blue },
    h6: { fontWeight: 600, color: NATURGY.blue },
    subtitle1: { fontWeight: 600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: NATURGY.white,
          color: NATURGY.blue,
          borderBottom: `1px solid ${NATURGY.grayMid}`,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 24,
          padding: '8px 24px',
        },
        containedPrimary: {
          '&:hover': { backgroundColor: NATURGY.orangeDark },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation1: {
          boxShadow: '0 1px 4px rgba(0,59,92,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: NATURGY.blue,
          color: NATURGY.white,
          borderRight: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: NATURGY.grayLight,
            borderBottom: `2px solid ${NATURGY.grayMid}`,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            color: NATURGY.blue,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#FFF4EA',
          },
        },
      },
    },
  },
});
