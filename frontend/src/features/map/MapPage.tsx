import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { PageHeader } from '../../shared/ui/PageHeader';
import { supplyPointsApi } from '../supplyPoints/api';
import type { SupplyPoint } from '../supplyPoints/types';

// Fix Leaflet default icon paths broken by bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface GeoPoint {
  lat: number;
  lon: number;
}

interface SupplyPointWithGeo extends SupplyPoint {
  geo?: GeoPoint;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVO: '#3AB54A',
  INACTIVO: '#F44336',
};

function makeMarkerIcon(color: string, size = 20): L.DivIcon {
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      transition: transform 0.15s;
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

async function geocodeMunicipio(municipio?: string, provincia?: string): Promise<GeoPoint | undefined> {
  const query = [municipio, provincia, 'España'].filter(Boolean).join(', ');
  if (!municipio && !provincia) return undefined;
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=es`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch {
    // ignore geocoding errors
  }
  return undefined;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Component to set map bounds when markers change
function FitBounds({ points }: { points: SupplyPointWithGeo[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter((p) => p.geo);
    if (valid.length === 0) return;
    const bounds = L.latLngBounds(valid.map((p) => [p.geo!.lat, p.geo!.lon]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [map, points]);
  return null;
}

export function MapPage() {
  const { t } = useTranslation();
  const [supplyPoints, setSupplyPoints] = useState<SupplyPointWithGeo[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [geocodingTotal, setGeocodingTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const loadAndGeocode = useCallback(async () => {
    abortRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const points: SupplyPoint[] = await supplyPointsApi.getAll();

      // Group by unique municipio+provincia to minimize Nominatim calls
      const uniqueLocations = new Map<string, GeoPoint | undefined>();
      for (const p of points) {
        const key = `${p.municipio ?? ''}|${p.provincia ?? ''}`;
        if (!uniqueLocations.has(key)) {
          uniqueLocations.set(key, undefined);
        }
      }

      const keys = Array.from(uniqueLocations.keys()).filter((k) => k !== '|');
      setGeocodingTotal(keys.length);
      setGeocodingProgress(0);

      for (let i = 0; i < keys.length; i++) {
        if (abortRef.current) break;
        const key = keys[i];
        const [municipio, provincia] = key.split('|');
        const geo = await geocodeMunicipio(municipio, provincia);
        uniqueLocations.set(key, geo);
        setGeocodingProgress(i + 1);
        if (i < keys.length - 1) await sleep(1100); // Nominatim 1 req/s policy
      }

      const withGeo: SupplyPointWithGeo[] = points.map((p) => ({
        ...p,
        geo: uniqueLocations.get(`${p.municipio ?? ''}|${p.provincia ?? ''}`),
      }));

      setSupplyPoints(withGeo);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadAndGeocode();
    return () => { abortRef.current = true; };
  }, [loadAndGeocode]);

  const counts = {
    total: supplyPoints.length,
    activo: supplyPoints.filter((p) => p.estado === 'ACTIVO').length,
    inactivo: supplyPoints.filter((p) => p.estado === 'INACTIVO').length,
    geocoded: supplyPoints.filter((p) => p.geo).length,
  };

  const isGeocoding = loading && geocodingTotal > 0;
  const geocodingPct = geocodingTotal > 0 ? Math.round((geocodingProgress / geocodingTotal) * 100) : 0;

  return (
    <Box sx={{ height: '100%' }}>
      <PageHeader title={t('map.title')} />

      {/* KPI strip */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Paper sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flex: '1 1 auto', minWidth: 140 }}>
          <LocationOnIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">{counts.total}</Typography>
            <Typography variant="caption" color="text.secondary">{t('map.totalPoints')}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flex: '1 1 auto', minWidth: 140 }}>
          <CheckCircleIcon sx={{ color: '#3AB54A', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#3AB54A' }}>{counts.activo}</Typography>
            <Typography variant="caption" color="text.secondary">{t('map.active')}</Typography>
          </Box>
        </Paper>
        <Paper sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flex: '1 1 auto', minWidth: 140 }}>
          <CancelIcon sx={{ color: '#F44336', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#F44336' }}>{counts.inactivo}</Typography>
            <Typography variant="caption" color="text.secondary">{t('map.inactive')}</Typography>
          </Box>
        </Paper>
      </Stack>

      {/* Geocoding progress */}
      {isGeocoding && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={18} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {t('map.geocoding')} ({geocodingProgress}/{geocodingTotal})
              </Typography>
              <LinearProgress variant="determinate" value={geocodingPct} sx={{ borderRadius: 4 }} />
            </Box>
            <Typography variant="body2" fontWeight={600}>{geocodingPct}%</Typography>
          </Stack>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Map */}
      <Paper
        sx={{
          overflow: 'hidden',
          borderRadius: 3,
          boxShadow: '0 4px 24px rgba(11,21,69,0.12)',
          position: 'relative',
        }}
      >
        {/* Legend */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            right: 12,
            zIndex: 1000,
            bgcolor: 'rgba(255,255,255,0.96)',
            borderRadius: 2,
            px: 2,
            py: 1.5,
            boxShadow: '0 2px 12px rgba(11,21,69,0.15)',
          }}
        >
          <Typography variant="caption" fontWeight={700} color="text.primary" sx={{ display: 'block', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
            {t('map.legend')}
          </Typography>
          {[
            { label: t('map.active'), color: '#3AB54A' },
            { label: t('map.inactive'), color: '#F44336' },
          ].map(({ label, color }) => (
            <Stack key={label} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.4 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Stack>
          ))}
          <Divider sx={{ my: 0.75 }} />
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
            {t('map.geocodedOf', { geocoded: counts.geocoded, total: counts.total })}
          </Typography>
        </Box>

        {loading && geocodingTotal === 0 ? (
          <Box sx={{ height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography color="text.secondary">{t('map.loadingPoints')}</Typography>
            </Stack>
          </Box>
        ) : (
          <MapContainer
            center={[40.4168, -3.7038]}
            zoom={6}
            style={{ height: 520, width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={supplyPoints.filter((p) => p.geo)} />
            {supplyPoints
              .filter((p) => p.geo)
              .map((sp) => {
                const color = STATUS_COLORS[sp.estado ?? ''] ?? '#9E9E9E';
                return (
                  <Marker
                    key={sp.cups}
                    position={[sp.geo!.lat, sp.geo!.lon]}
                    icon={makeMarkerIcon(color)}
                  >
                    <Popup minWidth={240} maxWidth={300}>
                      <Box sx={{ p: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5, fontFamily: 'Montserrat, sans-serif', wordBreak: 'break-all' }}>
                          {sp.cups}
                        </Typography>
                        <Chip
                          label={sp.estado}
                          size="small"
                          sx={{ bgcolor: color, color: 'white', fontWeight: 600, fontSize: '0.7rem', mb: 1 }}
                        />
                        <Divider sx={{ my: 0.75 }} />
                        {sp.clienteId && (
                          <Box sx={{ mb: 0.5 }}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>Cliente ID</Typography>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>#{sp.clienteId}</Typography>
                          </Box>
                        )}
                        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                          <Box>
                            <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>Zona</Typography>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 500 }}>{sp.zona ?? '—'}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>Tarifa</Typography>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 500 }}>{sp.tarifa ?? '—'}</Typography>
                          </Box>
                        </Stack>
                        {(sp.municipio ?? sp.provincia) && (
                          <Box sx={{ mt: 0.75 }}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>Ubicación</Typography>
                            <Typography sx={{ fontSize: '0.82rem' }}>
                              {[sp.municipio, sp.provincia].filter(Boolean).join(', ')}
                            </Typography>
                          </Box>
                        )}
                        {sp.calle && (
                          <Tooltip title={`${sp.calle ?? ''} ${sp.numero ?? ''}`.trim()}>
                            <Typography sx={{ fontSize: '0.75rem', color: '#999', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                              {sp.calle} {sp.numero}
                            </Typography>
                          </Tooltip>
                        )}
                      </Box>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>
        )}
      </Paper>
    </Box>
  );
}
