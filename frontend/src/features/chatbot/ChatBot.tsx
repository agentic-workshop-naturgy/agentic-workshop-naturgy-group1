import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MinimizeIcon from '@mui/icons-material/Remove';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { supplyPointsApi } from '../supplyPoints/api';
import { invoicesApi } from '../invoices/api';
import { readingsApi } from '../readings/api';
import { taxesApi } from '../taxes/api';
import { conversionFactorsApi } from '../conversionFactors/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  chips?: string[];
  timestamp: Date;
}

// ─── Currency formatter ───────────────────────────────────────────────────────
function fmtEur(v: number) {
  return v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
}

// ─── Intent engine ────────────────────────────────────────────────────────────
function matchIntent(text: string): string {
  const q = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/^(hola|hello|kaixo|hola|bon dia|buenos dias|hi\b|hey\b|ola\b)/.test(q)) return 'greeting';
  if (/ayuda|help|ajuda|laguntza|que puedes|what can|que sabs|zer egin/.test(q)) return 'help';
  if (/cuantos? punto|how many (supply|point)|quants? punt|zenbat hornidura|activo|actiu|aktibo/.test(q)) return 'supply_count';
  if (/zona|zone|eremu/.test(q)) return 'zones';
  if (/(total|cuanto|importe|quanto|zenbat).*(factura|invoice|bill)|factura.*(total|importe|cuanto)/.test(q)) return 'billing_total';
  if (/cuantas? factura|how many invoice|quantes? facture|zenbat faktura/.test(q)) return 'invoice_count';
  if (/(ultima|last|darrer|azken).*(lectura|reading|lecture)/.test(q)) return 'last_reading';
  if (/lectura|reading|consumo|consumption|lecture|irakurketa/.test(q)) return 'readings_summary';
  if (/factura|invoice|bill|faktura/.test(q)) return 'invoices_summary';
  if (/punto|supply|suministro|hornidura|punt/.test(q)) return 'supply_summary';
  if (/impuesto|tax|impost|zerga|iva/.test(q)) return 'tax_info';
  if (/(tarifa|tariff|tarifari|tarifa)/.test(q)) return 'tariff_info';
  if (/madrid|barcelona|sevilla|valencia|bilbao|zaragoza|malaga|vigo|gijon/.test(q)) return 'city_query';
  if (/periodo|period|mes|month|hilabete/.test(q)) return 'period_query';
  if (/gracias|thanks|gracies|eskerrik asko|gràcies/.test(q)) return 'thanks';
  return 'unknown';
}

// ─── Bot engine ───────────────────────────────────────────────────────────────
async function getBotResponse(intent: string, lang: string): Promise<{ text: string; chips?: string[] }> {
  const isEs = lang === 'es';
  const isCa = lang === 'ca';
  const isEu = lang === 'eu';

  const say = (es: string, ca: string, eu: string, en: string): string =>
    isEs ? es : isCa ? ca : isEu ? eu : en;

  const sayChips = (es: string[], ca: string[], eu: string[], en: string[]): string[] =>
    isEs ? es : isCa ? ca : isEu ? eu : en;

  try {
    switch (intent) {
      case 'greeting': {
        return {
          text: say(
            '¡Hola! Soy **Delta Assistant** 🤖, tu ayudante inteligente para gestionar tu red de gas. ¿En qué puedo ayudarte?',
            'Hola! Soc **Delta Assistant** 🤖, el teu ajudant intel·ligent per gestionar la teva xarxa de gas. En què et puc ajudar?',
            'Kaixo! Ni **Delta Assistant** naiz 🤖, zure gas sarearen laguntzaile adimenduna. Nola lagundu dezaket?',
            'Hello! I\'m **Delta Assistant** 🤖, your smart gas network management assistant. How can I help you?',
          ),
          chips: sayChips(
            ['¿Cuántos puntos activos?', '¿Total facturado?', '¿Últimas lecturas?', 'Ver zonas'],
            ['Quants punts actius?', 'Total facturat?', 'Darreres lectures?', 'Veure zones'],
            ['Zenbat puntu aktibo?', 'Guztira fakturatu?', 'Azken irakurketak?', 'Eremuak ikusi'],
            ['How many active points?', 'Total billed?', 'Last readings?', 'Show zones'],
          ),
        };
      }

      case 'help': {
        return {
          text: say(
            'Puedo ayudarte con:\n• 📍 **Puntos de suministro** — activos, inactivos, por zona\n• 🧾 **Facturas** — total facturado, por periodo\n• 📊 **Lecturas** — últimas lecturas, consumo\n• 💶 **Impuestos y tarifas** — tasas vigentes\n\nPrueba a preguntarme algo concreto 👇',
            'Et puc ajudar amb:\n• 📍 **Punts de subministrament** — actius, inactius, per zona\n• 🧾 **Factures** — total facturat, per període\n• 📊 **Lectures** — darreres lectures, consum\n• 💶 **Impostos i tarifes** — taxes vigents\n\nProvat a preguntar-me alguna cosa concreta 👇',
            'Lagundu dezaket:\n• 📍 **Hornidura puntuak** — aktiboak, inaktiboak, eremuaren arabera\n• 🧾 **Fakturak** — guztira fakturatu, aldika\n• 📊 **Irakurketak** — azken irakurketak, kontsumoa\n• 💶 **Zergak eta tarifak** — indarrean dauden tasak\n\nGaldetu zerbait zehatz 👇',
            'I can help you with:\n• 📍 **Supply points** — active, inactive, by zone\n• 🧾 **Invoices** — total billed, by period\n• 📊 **Readings** — latest readings, consumption\n• 💶 **Taxes & tariffs** — current rates\n\nTry asking me something specific 👇',
          ),
          chips: sayChips(
            ['¿Cuántos puntos activos?', '¿Total facturado?', 'Ver impuestos'],
            ['Quants punts actius?', 'Total facturat?', 'Veure impostos'],
            ['Zenbat puntu aktibo?', 'Guztira fakturatu?', 'Zergak ikusi'],
            ['How many active points?', 'Total billed?', 'Show taxes'],
          ),
        };
      }

      case 'supply_count':
      case 'supply_summary': {
        const points = await supplyPointsApi.getAll();
        const active = points.filter(p => p.estado === 'ACTIVO').length;
        const inactive = points.filter(p => p.estado === 'INACTIVO').length;
        const zones = [...new Set(points.map(p => p.zona))].sort();
        return {
          text: say(
            `Tu red cuenta con **${points.length} puntos de suministro** en total:\n• ✅ **${active} activos**\n• ❌ **${inactive} inactivos**\n\nZonas cubiertas: **${zones.join(', ')}**`,
            `La teva xarxa té **${points.length} punts de subministrament** en total:\n• ✅ **${active} actius**\n• ❌ **${inactive} inactius**\n\nZones cobertes: **${zones.join(', ')}**`,
            `Zure sareak **${points.length} hornidura puntu** ditu guztira:\n• ✅ **${active} aktibo**\n• ❌ **${inactive} inaktibo**\n\nEstalitako eremuak: **${zones.join(', ')}**`,
            `Your network has **${points.length} supply points** in total:\n• ✅ **${active} active**\n• ❌ **${inactive} inactive**\n\nCovered zones: **${zones.join(', ')}**`,
          ),
          chips: sayChips(
            ['¿Total facturado?', '¿Últimas lecturas?'],
            ['Total facturat?', 'Darreres lectures?'],
            ['Guztira fakturatu?', 'Azken irakurketak?'],
            ['Total billed?', 'Latest readings?'],
          ),
        };
      }

      case 'zones': {
        const points = await supplyPointsApi.getAll();
        const zones = [...new Set(points.map(p => p.zona))].sort();
        const byZone = zones.map(z => {
          const cnt = points.filter(p => p.zona === z).length;
          const act = points.filter(p => p.zona === z && p.estado === 'ACTIVO').length;
          return `**${z}**: ${cnt} puntos (${act} activos)`;
        });
        return {
          text: say(
            `Hay **${zones.length} zonas** en tu red:\n${byZone.join('\n')}`,
            `Hi ha **${zones.length} zones** a la teva xarxa:\n${byZone.join('\n')}`,
            `Zure sarean **${zones.length} eremu** daude:\n${byZone.join('\n')}`,
            `There are **${zones.length} zones** in your network:\n${byZone.join('\n')}`,
          ),
        };
      }

      case 'billing_total':
      case 'invoices_summary': {
        const invoices = await invoicesApi.getAll();
        if (invoices.length === 0) {
          return {
            text: say(
              'Aún no hay facturas emitidas. Ve a **Facturación** para ejecutar el proceso.',
              'Encara no hi ha factures emeses. Ves a **Facturació** per executar el procés.',
              'Oraindik ez dago faktura igorririk. Joan **Fakturazioera** prozesua exekutatzeko.',
              'No invoices have been issued yet. Go to **Billing** to run the process.',
            ),
            chips: sayChips(['Ir a Facturación'], ['Anar a Facturació'], ['Fakturaziora joan'], ['Go to Billing']),
          };
        }
        const total = invoices.reduce((s, i) => s + i.total, 0);
        const base = invoices.reduce((s, i) => s + i.base, 0);
        const taxes = invoices.reduce((s, i) => s + i.impuestos, 0);
        const periods = [...new Set(invoices.map(i => i.periodoInicio?.slice(0, 7)).filter(Boolean))].sort();
        const oldest = periods[0];
        const newest = periods[periods.length - 1];
        return {
          text: say(
            `Se han emitido **${invoices.length} facturas** por un total de **${fmtEur(total)}**:\n• Base imponible: **${fmtEur(base)}**\n• Impuestos: **${fmtEur(taxes)}**\n• Periodos: de **${oldest}** a **${newest}**`,
            `S'han emès **${invoices.length} factures** per un total de **${fmtEur(total)}**:\n• Base imposable: **${fmtEur(base)}**\n• Impostos: **${fmtEur(taxes)}**\n• Períodes: de **${oldest}** a **${newest}**`,
            `**${invoices.length} faktura** igorri dira, guztira **${fmtEur(total)}**:\n• Zerga-oinarria: **${fmtEur(base)}**\n• Zergak: **${fmtEur(taxes)}**\n• Aldiak: **${oldest}**etik **${newest}**era`,
            `**${invoices.length} invoices** have been issued for a total of **${fmtEur(total)}**:\n• Tax base: **${fmtEur(base)}**\n• Taxes: **${fmtEur(taxes)}**\n• Periods: from **${oldest}** to **${newest}**`,
          ),
        };
      }

      case 'invoice_count': {
        const invoices = await invoicesApi.getAll();
        return {
          text: say(
            `Actualmente hay **${invoices.length} facturas** en el sistema.`,
            `Actualment hi ha **${invoices.length} factures** al sistema.`,
            `Gaur egun **${invoices.length} faktura** daude sisteman.`,
            `There are currently **${invoices.length} invoices** in the system.`,
          ),
        };
      }

      case 'last_reading':
      case 'readings_summary': {
        const readings = await readingsApi.getAll();
        if (readings.length === 0) {
          return {
            text: say(
              'No hay lecturas registradas todavía.',
              'Encara no hi ha lectures registrades.',
              'Oraindik ez dago irakurketa erregistraturik.',
              'No readings have been recorded yet.',
            ),
          };
        }
        const sorted = [...readings].sort((a, b) => b.fecha.localeCompare(a.fecha));
        const last3 = sorted.slice(0, 3);
        const lines = last3.map(r => `• **${r.cups.slice(-6)}…** — ${r.lecturaM3.toLocaleString('es-ES')} m³ (${r.fecha})`);
        return {
          text: say(
            `Hay **${readings.length} lecturas** registradas. Las más recientes:\n${lines.join('\n')}`,
            `Hi ha **${readings.length} lectures** registrades. Les més recents:\n${lines.join('\n')}`,
            `**${readings.length} irakurketa** erregistratu dira. Azken berrienak:\n${lines.join('\n')}`,
            `There are **${readings.length} readings** recorded. Most recent:\n${lines.join('\n')}`,
          ),
        };
      }

      case 'tax_info': {
        const taxes = await taxesApi.getAll();
        if (taxes.length === 0) {
          return { text: say('No hay impuestos configurados.', 'No hi ha impostos configurats.', 'Ez dago zergarik konfiguratuta.', 'No taxes configured.') };
        }
        const lines = taxes.map(t => `• **${t.taxCode}**: ${(t.taxRate * 100).toFixed(2)}% (desde ${t.vigenciaDesde})`);
        return {
          text: say(
            `Impuestos vigentes:\n${lines.join('\n')}`,
            `Impostos vigents:\n${lines.join('\n')}`,
            `Indarrean dauden zergak:\n${lines.join('\n')}`,
            `Current taxes:\n${lines.join('\n')}`,
          ),
        };
      }

      case 'tariff_info': {
        const factors = await conversionFactorsApi.getAll();
        const points = await supplyPointsApi.getAll();
        const tariffs = [...new Set(points.map(p => p.tarifa))].sort();
        return {
          text: say(
            `Las tarifas activas son: **${tariffs.join(', ')}**.\nHay **${factors.length} factores de conversión** registrados.`,
            `Les tarifes actives són: **${tariffs.join(', ')}**.\nHi ha **${factors.length} factors de conversió** registrats.`,
            `Tarifak: **${tariffs.join(', ')}**.\n**${factors.length} bihurketa faktore** erregistratu dira.`,
            `Active tariffs: **${tariffs.join(', ')}**.\nThere are **${factors.length} conversion factors** registered.`,
          ),
        };
      }

      case 'city_query': {
        const points = await supplyPointsApi.getAll();
        const withCity = points.filter(p => p.municipio);
        const cities = [...new Set(withCity.map(p => p.municipio!))].sort();
        return {
          text: say(
            `Hay puntos de suministro en **${cities.length} municipios**: ${cities.join(', ')}.`,
            `Hi ha punts de subministrament en **${cities.length} municipis**: ${cities.join(', ')}.`,
            `**${cities.length} udalerritako** hornidura puntuak daude: ${cities.join(', ')}.`,
            `Supply points are located in **${cities.length} municipalities**: ${cities.join(', ')}.`,
          ),
        };
      }

      case 'period_query': {
        const invoices = await invoicesApi.getAll();
        const periods = [...new Set(invoices.map(i => i.periodoInicio?.slice(0, 7)).filter(Boolean))].sort();
        if (periods.length === 0) {
          return { text: say('Sin periodos facturados aún.', 'Sense períodes facturats encara.', 'Oraindik ez dago fakturazio aldirik.', 'No billed periods yet.') };
        }
        return {
          text: say(
            `Periodos con facturas: **${periods.join(', ')}**`,
            `Períodes amb factures: **${periods.join(', ')}**`,
            `Fakturak dituzten aldiak: **${periods.join(', ')}**`,
            `Periods with invoices: **${periods.join(', ')}**`,
          ),
        };
      }

      case 'thanks': {
        return {
          text: say(
            '¡De nada! 😊 Aquí estaré si necesitas algo más.',
            'De res! 😊 Aquí estaré si necessites alguna cosa més.',
            'Ez horregatik! 😊 Hemen egongo naiz zerbait gehiago behar baduzu.',
            'You\'re welcome! 😊 I\'ll be here if you need anything else.',
          ),
        };
      }

      default: {
        return {
          text: say(
            'No he entendido bien tu pregunta 🤔 Puedo ayudarte con puntos de suministro, facturas, lecturas, zonas e impuestos. ¿Quieres ver las opciones disponibles?',
            'No he entès bé la teva pregunta 🤔 Puc ajudar-te amb punts de subministrament, factures, lectures, zones i impostos. Vols veure les opcions disponibles?',
            'Ez dut galdera ondo ulertu 🤔 Hornidura puntuak, fakturak, irakurketak, eremuak eta zergekin lagundu dezaket. Erabilgarri dauden aukerak ikusi nahi dituzu?',
            'I didn\'t quite understand your question 🤔 I can help with supply points, invoices, readings, zones and taxes. Want to see available options?',
          ),
          chips: sayChips(
            ['Ver opciones', '¿Cuántos puntos activos?', '¿Total facturado?'],
            ['Veure opcions', 'Quants punts actius?', 'Total facturat?'],
            ['Aukerak ikusi', 'Zenbat puntu aktibo?', 'Guztira fakturatu?'],
            ['Show options', 'How many active points?', 'Total billed?'],
          ),
        };
      }
    }
  } catch {
    return {
      text: say(
        'Hubo un error al consultar los datos. ¿Está el servidor arrancado?',
        'Hi ha hagut un error en consultar les dades. Està el servidor engegat?',
        'Errore bat gertatu da datuak kontsultatzean. Abiarazita al dago zerbitzaria?',
        'There was an error fetching data. Is the server running?',
      ),
    };
  }
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function renderMarkdown(text: string) {
  const parts = text.split('\n');
  return parts.map((line, i) => {
    const rendered = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return (
      <span key={i}>
        {i > 0 && <br />}
        <span dangerouslySetInnerHTML={{ __html: rendered }} />
      </span>
    );
  });
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, onChipClick }: { msg: Message; onChipClick: (t: string) => void }) {
  const isBot = msg.role === 'bot';
  return (
    <Box sx={{ display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end', mb: 1.5, alignItems: 'flex-end', gap: 1 }}>
      {isBot && (
        <Avatar sx={{ width: 28, height: 28, bgcolor: '#3AB54A', flexShrink: 0, mb: 0.25 }}>
          <SmartToyIcon sx={{ fontSize: 16 }} />
        </Avatar>
      )}
      <Box sx={{ maxWidth: '80%' }}>
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.25,
            borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
            bgcolor: isBot ? '#F4F6FA' : 'linear-gradient(135deg, #3AB54A, #2A8C38)',
            background: isBot ? '#F4F6FA' : 'linear-gradient(135deg, #3AB54A 0%, #2A8C38 100%)',
            color: isBot ? 'text.primary' : '#fff',
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.6, fontSize: '0.875rem' }}>
            {renderMarkdown(msg.text)}
          </Typography>
        </Paper>
        {isBot && msg.chips && msg.chips.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.75 }}>
            {msg.chips.map((chip) => (
              <Chip
                key={chip}
                label={chip}
                size="small"
                onClick={() => onChipClick(chip)}
                sx={{
                  bgcolor: '#EAF7ED',
                  color: '#2A8C38',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  border: '1px solid #C8EDD0',
                  '&:hover': { bgcolor: '#D4F0D9' },
                }}
              />
            ))}
          </Stack>
        )}
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, textAlign: isBot ? 'left' : 'right', fontSize: '0.65rem' }}>
          {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Main ChatBot component ───────────────────────────────────────────────────
export function ChatBot() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: crypto.randomUUID(), timestamp: new Date() }]);
  }, []);

  // Initial greeting
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void (async () => {
      setThinking(true);
      await new Promise(r => setTimeout(r, 600));
      const res = await getBotResponse('greeting', i18n.language);
      addMessage({ role: 'bot', text: res.text, chips: res.chips });
      setThinking(false);
      if (!open) setUnread(1);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setInput('');
    addMessage({ role: 'user', text: trimmed });
    setThinking(true);
    // Simulate realistic typing delay
    await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
    const intent = matchIntent(trimmed);
    const res = await getBotResponse(intent, i18n.language);
    addMessage({ role: 'bot', text: res.text, chips: res.chips });
    setThinking(false);
  }, [addMessage, i18n.language, thinking]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend(input);
    }
  };

  return (
    <>
      {/* Chat panel */}
      <Collapse
        in={open}
        sx={{
          position: 'fixed',
          bottom: 88,
          right: 24,
          zIndex: 1400,
          transformOrigin: 'bottom right',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: 360,
            maxWidth: 'calc(100vw - 48px)',
            height: 520,
            maxHeight: 'calc(100vh - 120px)',
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(11,21,69,0.22)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              background: 'linear-gradient(135deg, #0B1545 0%, #162060 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #3AB54A, #2A8C38)' }}>
              <SmartToyIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography variant="subtitle2" fontWeight={700} color="white">
                  Delta Assistant
                </Typography>
                <AutoAwesomeIcon sx={{ fontSize: 14, color: '#3AB54A' }} />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#3AB54A', animation: 'pulse 2s infinite' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                  {thinking ? 'Escribiendo…' : 'En línea'}
                </Typography>
              </Stack>
            </Box>
            <Tooltip title="Minimizar">
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}>
                <MinimizeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider />

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 2,
              py: 1.5,
              bgcolor: '#FAFBFD',
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#C0CCE0', borderRadius: '4px' },
            }}
          >
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} onChipClick={(t) => void handleSend(t)} />
            ))}
            {thinking && (
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 1.5 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: '#3AB54A' }}>
                  <SmartToyIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Paper elevation={0} sx={{ px: 2, py: 1.25, borderRadius: '4px 16px 16px 16px', bgcolor: '#F4F6FA' }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {[0, 1, 2].map(i => (
                      <Box
                        key={i}
                        sx={{
                          width: 7, height: 7, borderRadius: '50%', bgcolor: '#3AB54A',
                          animation: 'bounce 1.2s infinite',
                          animationDelay: `${i * 0.2}s`,
                          '@keyframes bounce': {
                            '0%, 80%, 100%': { transform: 'scale(0.7)', opacity: 0.5 },
                            '40%': { transform: 'scale(1)', opacity: 1 },
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Paper>
              </Box>
            )}
            <div ref={bottomRef} />
          </Box>

          {/* Input */}
          <Box sx={{ px: 2, py: 1.5, bgcolor: '#fff', flexShrink: 0, borderTop: '1px solid #F0F2F8' }}>
            <TextField
              inputRef={inputRef}
              fullWidth
              size="small"
              placeholder="Escribe tu pregunta…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={thinking}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 24,
                  bgcolor: '#F4F6FA',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: '#C8EDD0' },
                  '&.Mui-focused fieldset': { borderColor: '#3AB54A' },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => void handleSend(input)}
                      disabled={!input.trim() || thinking}
                      sx={{
                        bgcolor: input.trim() ? '#3AB54A' : '#E0E0E0',
                        color: '#fff',
                        width: 30,
                        height: 30,
                        '&:hover': { bgcolor: '#2A8C38' },
                        '&.Mui-disabled': { bgcolor: '#E0E0E0', color: '#9E9E9E' },
                        transition: 'all 0.2s',
                      }}
                    >
                      {thinking ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Paper>
      </Collapse>

      {/* FAB */}
      <Tooltip title="Delta Assistant" placement="left">
        <Fab
          onClick={() => setOpen(o => !o)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1400,
            background: open
              ? 'linear-gradient(135deg, #0B1545, #162060)'
              : 'linear-gradient(135deg, #3AB54A, #2A8C38)',
            color: '#fff',
            boxShadow: '0 6px 20px rgba(11,21,69,0.3)',
            transition: 'all 0.25s',
            '&:hover': {
              background: open
                ? 'linear-gradient(135deg, #162060, #1e2d7a)'
                : 'linear-gradient(135deg, #2A8C38, #1F6B2A)',
              transform: 'scale(1.08)',
            },
          }}
        >
          {open ? <CloseIcon /> : (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SmartToyIcon />
              {unread > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: -12,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: '#F44336',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid white',
                    animation: 'pulse-red 1.5s infinite',
                    '@keyframes pulse-red': {
                      '0%': { boxShadow: '0 0 0 0 rgba(244,67,54,0.5)' },
                      '70%': { boxShadow: '0 0 0 8px rgba(244,67,54,0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(244,67,54,0)' },
                    },
                  }}
                >
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{unread}</Typography>
                </Box>
              )}
            </Box>
          )}
        </Fab>
      </Tooltip>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
