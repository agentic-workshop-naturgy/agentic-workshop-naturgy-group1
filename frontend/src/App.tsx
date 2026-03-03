import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import GasMeterIcon from '@mui/icons-material/GasMeter';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TransformIcon from '@mui/icons-material/Transform';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import DescriptionIcon from '@mui/icons-material/Description';
import LanguageIcon from '@mui/icons-material/Language';
import { DRAWER_WIDTH, NATURGY } from './app/theme';
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
  labelKey: string;
  icon: React.ReactNode;
  sectionKey?: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'supply-points', labelKey: 'nav.supplyPoints', icon: <GasMeterIcon />, sectionKey: 'nav.sectionMasters' },
  { key: 'readings', labelKey: 'nav.readings', icon: <ShowChartIcon /> },
  { key: 'tariffs', labelKey: 'nav.tariffs', icon: <LocalOfferIcon /> },
  { key: 'conversion-factors', labelKey: 'nav.conversionFactors', icon: <TransformIcon /> },
  { key: 'taxes', labelKey: 'nav.taxes', icon: <AccountBalanceIcon /> },
  { key: 'billing', labelKey: 'nav.billing', icon: <RequestQuoteIcon />, sectionKey: 'nav.sectionBilling' },
  { key: 'invoices', labelKey: 'nav.invoices', icon: <DescriptionIcon /> },
];

const PAGE_TITLE_KEYS: Record<PageKey, string> = {
  'supply-points': 'supplyPoints.title',
  readings: 'readings.title',
  tariffs: 'tariffs.title',
  'conversion-factors': 'conversionFactors.title',
  taxes: 'taxes.title',
  billing: 'billing.title',
  invoices: 'invoices.title',
};

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'ca', label: 'Català' },
];

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
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState<PageKey>('supply-points');
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);

  let lastSection = '';

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language)?.label
    ?? LANGUAGES.find((l) => i18n.language.startsWith(l.code))?.label
    ?? 'Español';

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${DRAWER_WIDTH}px)`, ml: `${DRAWER_WIDTH}px` }}
        elevation={0}
      >
        <Toolbar>
          <Typography variant="h6" noWrap fontWeight={700}>
            {t(PAGE_TITLE_KEYS[currentPage])}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />

          {/* Language selector */}
          <IconButton
            onClick={(e) => setLangAnchor(e.currentTarget)}
            sx={{ mr: 1, color: NATURGY.blue }}
          >
            <LanguageIcon />
          </IconButton>
          <Typography
            variant="body2"
            sx={{ color: NATURGY.grayText, fontWeight: 600, cursor: 'pointer', mr: 2 }}
            onClick={(e) => setLangAnchor(e.currentTarget as HTMLElement)}
          >
            {currentLang}
          </Typography>
          <Menu
            anchorEl={langAnchor}
            open={Boolean(langAnchor)}
            onClose={() => setLangAnchor(null)}
          >
            {LANGUAGES.map((lang) => (
              <MenuItem
                key={lang.code}
                selected={i18n.language === lang.code || i18n.language.startsWith(lang.code)}
                onClick={() => { void i18n.changeLanguage(lang.code); setLangAnchor(null); }}
              >
                {lang.label}
              </MenuItem>
            ))}
          </Menu>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: NATURGY.grayLight,
              px: 2,
              py: 0.5,
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: NATURGY.grayText, fontWeight: 600 }}>
              {t('app.title')}
            </Typography>
          </Box>
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
          },
        }}
      >
        {/* Logo Naturgy */}
        <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            component="img"
            src="/logo-naturgy.svg"
            alt="Naturgy"
            sx={{ height: 34 }}
          />
        </Box>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        <List sx={{ px: 1, pt: 1 }}>
          {NAV_ITEMS.map((item) => {
            const sectionLabel = item.sectionKey ? t(item.sectionKey) : '';
            const showSection = item.sectionKey != null && sectionLabel !== lastSection;
            if (item.sectionKey != null) lastSection = sectionLabel;
            return (
              <Box key={item.key}>
                {showSection && (
                  <Typography
                    variant="overline"
                    sx={{ px: 2, pt: 2, pb: 0.5, display: 'block', opacity: 0.6, fontSize: '0.65rem' }}
                  >
                    {sectionLabel}
                  </Typography>
                )}
                <ListItem disablePadding>
                  <ListItemButton
                    selected={currentPage === item.key}
                    onClick={() => setCurrentPage(item.key)}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.5,
                      color: 'inherit',
                      transition: 'all 0.15s ease',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(245,131,31,0.2)',
                        borderLeft: `3px solid ${NATURGY.orange}`,
                        '&:hover': { bgcolor: 'rgba(245,131,31,0.28)' },
                      },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={t(item.labelKey)}
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
