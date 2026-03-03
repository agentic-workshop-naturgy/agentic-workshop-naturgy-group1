import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

function SpainFlag() {
  return (
    <svg viewBox="0 0 24 16" width={24} height={16}>
      <rect y={0} width={24} height={4} fill="#c60b1e" />
      <rect y={4} width={24} height={8} fill="#ffc400" />
      <rect y={12} width={24} height={4} fill="#c60b1e" />
    </svg>
  );
}

function CatalanFlag() {
  return (
    <svg viewBox="0 0 24 16" width={24} height={16}>
      <rect width={24} height={16} fill="#FCDD09" />
      <rect y={1.78} width={24} height={1.78} fill="#DA121A" />
      <rect y={5.33} width={24} height={1.78} fill="#DA121A" />
      <rect y={8.89} width={24} height={1.78} fill="#DA121A" />
      <rect y={12.44} width={24} height={1.78} fill="#DA121A" />
    </svg>
  );
}

function BasqueFlag() {
  return (
    <svg viewBox="0 0 24 16" width={24} height={16}>
      <rect width={24} height={16} fill="#D52B1E" />
      <line x1={0} y1={0} x2={24} y2={16} stroke="#009B48" strokeWidth={2.5} />
      <line x1={24} y1={0} x2={0} y2={16} stroke="#009B48" strokeWidth={2.5} />
      <rect x={10} y={0} width={4} height={16} fill="#fff" />
      <rect x={0} y={6} width={24} height={4} fill="#fff" />
    </svg>
  );
}

function UKFlag() {
  return (
    <svg viewBox="0 0 24 16" width={24} height={16}>
      <rect width={24} height={16} fill="#012169" />
      <line x1={0} y1={0} x2={24} y2={16} stroke="#fff" strokeWidth={3} />
      <line x1={24} y1={0} x2={0} y2={16} stroke="#fff" strokeWidth={3} />
      <line x1={0} y1={0} x2={24} y2={16} stroke="#C8102E" strokeWidth={1.5} />
      <line x1={24} y1={0} x2={0} y2={16} stroke="#C8102E" strokeWidth={1.5} />
      <rect x={9.5} y={0} width={5} height={16} fill="#fff" />
      <rect x={0} y={5.5} width={24} height={5} fill="#fff" />
      <rect x={10.5} y={0} width={3} height={16} fill="#C8102E" />
      <rect x={0} y={6.5} width={24} height={3} fill="#C8102E" />
    </svg>
  );
}

interface LangOption {
  code: string;
  label: string;
  Flag: React.FC;
}

const LANGUAGES: LangOption[] = [
  { code: 'es', label: 'Castellano', Flag: SpainFlag },
  { code: 'ca', label: 'Català', Flag: CatalanFlag },
  { code: 'eu', label: 'Euskara', Flag: BasqueFlag },
  { code: 'en', label: 'English', Flag: UKFlag },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {LANGUAGES.map((lang) => (
        <Tooltip key={lang.code} title={lang.label}>
          <IconButton
            size="small"
            onClick={() => void i18n.changeLanguage(lang.code)}
            sx={{
              border: i18n.language === lang.code ? '2px solid white' : '2px solid transparent',
              borderRadius: 1,
              p: 0.3,
              opacity: i18n.language === lang.code ? 1 : 0.6,
              '&:hover': { opacity: 1 },
            }}
          >
            <lang.Flag />
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
}
