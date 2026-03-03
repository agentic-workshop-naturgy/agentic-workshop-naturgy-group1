import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import PeopleIcon from '@mui/icons-material/People';
import MapIcon from '@mui/icons-material/Map';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { DRAWER_WIDTH } from './app/theme';
import { LanguageSwitcher } from './shared/ui/LanguageSwitcher';
import { ClientesPage } from './features/clientes/ClientesPage';
import { SupplyPointsPage } from './features/supplyPoints/SupplyPointsPage';
import { ReadingsPage } from './features/readings/ReadingsPage';
import { TariffsPage } from './features/tariffs/TariffsPage';
import { ConversionFactorsPage } from './features/conversionFactors/ConversionFactorsPage';
import { TaxesPage } from './features/taxes/TaxesPage';
import { BillingPage } from './features/billing/BillingPage';
import { InvoicesPage } from './features/invoices/InvoicesPage';
import { MapPage } from './features/map/MapPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ChatBot } from './features/chatbot/ChatBot';

type PageKey =
  | 'dashboard'
  | 'clientes'
  | 'supply-points'
  | 'readings'
  | 'tariffs'
  | 'conversion-factors'
  | 'taxes'
  | 'billing'
  | 'invoices'
  | 'map';

interface NavItem {
  key: PageKey;
  labelKey: string;
  icon: React.ReactNode;
  sectionKey?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', icon: <DashboardIcon />, sectionKey: 'nav.overviewSection' },
  { key: 'clientes', labelKey: 'nav.clients', icon: <PeopleIcon />, sectionKey: 'nav.mastersSection' },
  { key: 'supply-points', labelKey: 'nav.supplyPoints', icon: <GasMeterIcon /> },
  { key: 'readings', labelKey: 'nav.readings', icon: <ShowChartIcon /> },
  { key: 'tariffs', labelKey: 'nav.tariffs', icon: <LocalOfferIcon /> },
  { key: 'conversion-factors', labelKey: 'nav.conversionFactors', icon: <TransformIcon /> },
  { key: 'taxes', labelKey: 'nav.taxes', icon: <AccountBalanceIcon /> },
  { key: 'billing', labelKey: 'nav.billing', icon: <RequestQuoteIcon />, sectionKey: 'nav.billingSection' },
  { key: 'invoices', labelKey: 'nav.invoices', icon: <DescriptionIcon /> },
  { key: 'map', labelKey: 'nav.map', icon: <MapIcon />, sectionKey: 'nav.mapSection' },
];

const PAGE_TITLE_KEYS: Record<PageKey, string> = {
  dashboard: 'appBar.dashboard',
  clientes: 'appBar.clients',
  'supply-points': 'appBar.supplyPoints',
  readings: 'appBar.readings',
  tariffs: 'appBar.tariffs',
  'conversion-factors': 'appBar.conversionFactors',
  taxes: 'appBar.taxes',
  billing: 'appBar.billing',
  invoices: 'appBar.invoices',
  map: 'appBar.map',
};

function renderPage(page: PageKey): React.ReactNode {
  switch (page) {
    case 'dashboard': return <DashboardPage />;
    case 'clientes': return <ClientesPage />;
    case 'supply-points': return <SupplyPointsPage />;
    case 'readings': return <ReadingsPage />;
    case 'tariffs': return <TariffsPage />;
    case 'conversion-factors': return <ConversionFactorsPage />;
    case 'taxes': return <TaxesPage />;
    case 'billing': return <BillingPage />;
    case 'invoices': return <InvoicesPage />;
    case 'map': return <MapPage />;
  }
}

export function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
  const { t } = useTranslation();

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
            {t(PAGE_TITLE_KEYS[currentPage])}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <LanguageSwitcher />
          <Typography variant="body2" sx={{ opacity: 0.7, ml: 2 }}>
            {t('common.appSubtitle')}
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
            background: 'linear-gradient(180deg, #0B1545 0%, #162060 100%)',
            color: '#ffffff',
            borderRight: 'none',
            boxShadow: '4px 0 20px rgba(11,21,69,0.18)',
          },
        }}
      >
        <Toolbar sx={{ px: 2.5, py: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3AB54A 0%, #2A8C38 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <GasMeterIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="inherit" sx={{ lineHeight: 1.1, fontSize: '1.15rem' }}>
                {t('common.appTitle')}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Gas Management
              </Typography>
            </Box>
          </Box>
        </Toolbar>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />

        <List sx={{ px: 1.5, pt: 1.5, pb: 2 }}>
          {NAV_ITEMS.map((item) => {
            const showSection = item.sectionKey != null && item.sectionKey !== lastSection;
            if (item.sectionKey != null) lastSection = item.sectionKey;
            return (
              <Box key={item.key}>
                {showSection && (
                  <Typography
                    variant="overline"
                    sx={{ px: 1.5, pt: 2.5, pb: 0.5, display: 'block', opacity: 0.45, fontSize: '0.6rem', letterSpacing: '0.12em' }}
                  >
                    {t(item.sectionKey!)}
                  </Typography>
                )}
                <ListItem disablePadding>
                  <ListItemButton
                    selected={currentPage === item.key}
                    onClick={() => setCurrentPage(item.key)}
                    sx={{
                      borderRadius: '10px',
                      mb: 0.5,
                      color: currentPage === item.key ? '#ffffff' : 'rgba(255,255,255,0.65)',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #3AB54A 0%, #2A8C38 100%)',
                        color: '#ffffff',
                        '&:hover': { background: 'linear-gradient(135deg, #2A8C38 0%, #1F6B2A 100%)' },
                      },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: '#ffffff' },
                      transition: 'all 0.15s',
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={t(item.labelKey)}
                      primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: currentPage === item.key ? 600 : 400 }}
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
        <Container maxWidth="xl" sx={{ py: 3.5 }}>
          {renderPage(currentPage)}
        </Container>
      </Box>
      <ChatBot />
    </Box>
  );
}
