import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import GasMeterIcon from '@mui/icons-material/GasMeter';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TransformIcon from '@mui/icons-material/Transform';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import DescriptionIcon from '@mui/icons-material/Description';
import { DRAWER_WIDTH } from './app/theme';
import { SupplyPointsPage } from './features/supplyPoints/SupplyPointsPage';
import { ReadingsPage } from './features/readings/ReadingsPage';
import { TariffsPage } from './features/tariffs/TariffsPage';
import { ConversionFactorsPage } from './features/conversionFactors/ConversionFactorsPage';
import { TaxesPage } from './features/taxes/TaxesPage';
import { BillingPage } from './features/billing/BillingPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';

type PageKey =
  | 'supply-points'
  | 'readings'
  | 'tariffs'
  | 'conversion-factors'
  | 'taxes'
  | 'billing'
  | 'invoices';

interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'supply-points', label: 'Puntos de Suministro', icon: <GasMeterIcon />, section: 'Maestros' },
  { key: 'readings', label: 'Lecturas', icon: <ShowChartIcon /> },
  { key: 'tariffs', label: 'Tarifario', icon: <LocalOfferIcon /> },
  { key: 'conversion-factors', label: 'Factores Conversión', icon: <TransformIcon /> },
  { key: 'taxes', label: 'Impuestos (IVA)', icon: <AccountBalanceIcon /> },
  { key: 'billing', label: 'Facturación', icon: <RequestQuoteIcon />, section: 'Facturación' },
  { key: 'invoices', label: 'Facturas', icon: <DescriptionIcon /> },
];

const PAGE_TITLES: Record<PageKey, string> = {
  'supply-points': 'Puntos de Suministro',
  readings: 'Lecturas de Gas',
  tariffs: 'Tarifario',
  'conversion-factors': 'Factores de Conversión',
  taxes: 'Impuestos (IVA)',
  billing: 'Ejecutar Facturación',
  invoices: 'Facturas',
};

function renderPage(page: PageKey): React.ReactNode {
  switch (page) {
    case 'supply-points': return <SupplyPointsPage />;
    case 'readings': return <ReadingsPage />;
    case 'tariffs': return <TariffsPage />;
    case 'conversion-factors': return <ConversionFactorsPage />;
    case 'taxes': return <TaxesPage />;
    case 'billing': return <BillingPage />;
    case 'invoices': return <InvoicesPage />;
  }
}

export function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('supply-points');

  let lastSection = '';

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${DRAWER_WIDTH}px)`, ml: `${DRAWER_WIDTH}px` }}
        elevation={1}
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            {PAGE_TITLES[currentPage]}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            GAS Workshop · Naturgy
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          },
        }}
      >
        <Toolbar sx={{ px: 2 }}>
          <GasMeterIcon sx={{ mr: 1, color: 'secondary.light' }} />
          <Typography variant="h6" fontWeight={700} color="inherit">
            GAS Workshop
          </Typography>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

        <List sx={{ px: 1, pt: 1 }}>
          {NAV_ITEMS.map((item) => {
            const showSection = item.section != null && item.section !== lastSection;
            if (item.section != null) lastSection = item.section;
            return (
              <Box key={item.key}>
                {showSection && (
                  <Typography
                    variant="overline"
                    sx={{ px: 2, pt: 2, pb: 0.5, display: 'block', opacity: 0.6, fontSize: '0.65rem' }}
                  >
                    {item.section}
                  </Typography>
                )}
                <ListItem disablePadding>
                  <ListItemButton
                    selected={currentPage === item.key}
                    onClick={() => setCurrentPage(item.key)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      color: 'inherit',
                      '&.Mui-selected': {
                        bgcolor: 'secondary.main',
                        '&:hover': { bgcolor: 'secondary.dark' },
                      },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              </Box>
            );
          })}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {renderPage(currentPage)}
        </Container>
      </Box>
    </Box>
  );
}
