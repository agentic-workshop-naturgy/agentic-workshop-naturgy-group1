import { createTheme } from '@mui/material/styles';

export const DRAWER_WIDTH = 256;

export const theme = createTheme({
  palette: {
    primary: {
      main: '#3AB54A',
      light: '#5DC86A',
      dark: '#2A8C38',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0B1545',
      light: '#1B2F7B',
      dark: '#070D2E',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F4F6FA',
      paper: '#ffffff',
    },
    text: {
      primary: '#0B1545',
      secondary: '#5A6A8A',
    },
    divider: '#E0E6EF',
  },
  typography: {
    fontFamily: '"Montserrat", "Inter", "Roboto", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 24,
          textTransform: 'none',
          paddingLeft: 24,
          paddingRight: 24,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #3AB54A 0%, #2A8C38 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #2A8C38 0%, #1F6B2A 100%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(11,21,69,0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(11,21,69,0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #0B1545 0%, #162060 100%)',
          boxShadow: '0 2px 8px rgba(11,21,69,0.18)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-expect-error MuiDataGrid component overrides added by @mui/x-data-grid
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: 12,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#F4F6FA',
            borderRadius: '12px 12px 0 0',
            fontWeight: 700,
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#5A6A8A',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#EAF7ED',
          },
          '& .MuiDataGrid-row.Mui-selected': {
            backgroundColor: '#D4F0D9',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.12)' },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: { borderRadius: 8 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(11,21,69,0.18)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
});

