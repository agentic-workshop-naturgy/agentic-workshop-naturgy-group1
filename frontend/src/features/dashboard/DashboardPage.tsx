import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import GasMeterIcon from '@mui/icons-material/GasMeter';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EuroIcon from '@mui/icons-material/Euro';
import BoltIcon from '@mui/icons-material/Bolt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import { supplyPointsApi } from '../supplyPoints/api';
import { invoicesApi } from '../invoices/api';
import { readingsApi } from '../readings/api';
import type { SupplyPoint } from '../supplyPoints/types';
import type { Invoice } from '../invoices/types';
import type { GasReading } from '../readings/types';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useAnimatedCount(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);
  return count;
}

// ─── Currency formatter ───────────────────────────────────────────────────────
function fmtEur(val: number) {
  return val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: number;
  format?: 'number' | 'currency' | 'decimal';
  unit?: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: number; // % vs previous
  loading: boolean;
}

function KpiCard({ title, value, format = 'number', unit, icon, gradient, trend, loading }: KpiCardProps) {
  const animated = useAnimatedCount(loading ? 0 : Math.round(value));
  const display = loading
    ? '—'
    : format === 'currency'
      ? fmtEur(animated)
      : format === 'decimal'
        ? value.toLocaleString('es-ES', { maximumFractionDigits: 1 })
        : animated.toLocaleString('es-ES');

  return (
    <Card
      sx={{
        background: gradient,
        color: '#fff',
        borderRadius: 3,
        boxShadow: '0 6px 24px rgba(11,21,69,0.16)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 12px 32px rgba(11,21,69,0.22)' },
      }}
    >
      {/* decorative circle */}
      <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ position: 'absolute', top: 30, right: 30, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography sx={{ opacity: 0.8, fontSize: '0.8rem', fontWeight: 500, mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width={100} height={52} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            ) : (
              <Typography sx={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, mb: 0.5, fontFamily: 'Montserrat, sans-serif' }}>
                {display}{unit && <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: 4, opacity: 0.8 }}>{unit}</span>}
              </Typography>
            )}
            {trend !== undefined && !loading && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                {trend >= 0
                  ? <TrendingUpIcon sx={{ fontSize: 16, opacity: 0.9 }} />
                  : <TrendingDownIcon sx={{ fontSize: 16, opacity: 0.9 }} />}
                <Typography sx={{ fontSize: '0.75rem', opacity: 0.85 }}>
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                </Typography>
              </Stack>
            )}
          </Box>
          <Box sx={{ opacity: 0.85, fontSize: 40, display: 'flex', mt: 0.5 }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5, borderRadius: 2, boxShadow: '0 4px 16px rgba(11,21,69,0.18)', minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <Stack key={entry.dataKey} direction="row" justifyContent="space-between" spacing={2}>
          <Typography variant="body2" sx={{ color: entry.color, fontWeight: 600 }}>{entry.name}</Typography>
          <Typography variant="body2" fontWeight={700}>
            {typeof entry.value === 'number' && entry.value > 100
              ? fmtEur(entry.value)
              : entry.value}
          </Typography>
        </Stack>
      ))}
    </Paper>
  );
}

const ZONE_COLORS = ['#3AB54A', '#0B1545', '#5A8DEE', '#FF9800', '#E91E63', '#00BCD4'];

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const [supplyPoints, setSupplyPoints] = useState<SupplyPoint[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [readings, setReadings] = useState<GasReading[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sp, inv, rd] = await Promise.all([
        supplyPointsApi.getAll(),
        invoicesApi.getAll(),
        readingsApi.getAll(),
      ]);
      setSupplyPoints(sp);
      setInvoices(inv);
      setReadings(rd);
    } catch {
      // errors shown by each sub-page; dashboard just shows 0s
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const activePoints = supplyPoints.filter((s) => s.estado === 'ACTIVO').length;
  const totalInvoices = invoices.length;
  const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
  const totalReadings = readings.length;

  // ── Monthly evolution (area chart) ────────────────────────────────────────
  const monthlyMap = new Map<string, number>();
  for (const inv of invoices) {
    const m = inv.periodoInicio?.slice(0, 7) ?? inv.fechaEmision?.slice(0, 7) ?? 'N/A';
    monthlyMap.set(m, (monthlyMap.get(m) ?? 0) + inv.total);
  }
  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }));

  // ── Billing by zone (bar chart) ───────────────────────────────────────────
  const cupToZone = new Map(supplyPoints.map((s) => [s.cups, s.zona]));
  const zoneMap = new Map<string, number>();
  for (const inv of invoices) {
    const z = cupToZone.get(inv.cups) ?? 'Desconocida';
    zoneMap.set(z, (zoneMap.get(z) ?? 0) + inv.total);
  }
  const zoneData = Array.from(zoneMap.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([zona, total]) => ({ zona, total: Math.round(total * 100) / 100 }));

  // ── Top CUPS by billed amount ─────────────────────────────────────────────
  const cupsMap = new Map<string, number>();
  for (const inv of invoices) {
    cupsMap.set(inv.cups, (cupsMap.get(inv.cups) ?? 0) + inv.total);
  }
  const topCups = Array.from(cupsMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cups, total], i) => ({ cups, total, rank: i + 1 }));

  const noData = !loading && invoices.length === 0;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="secondary.main" sx={{ fontFamily: 'Montserrat, sans-serif' }}>
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('dashboard.subtitle')}
          </Typography>
        </Box>
        {!loading && (
          <Chip
            label={t('dashboard.liveData')}
            size="small"
            sx={{ bgcolor: '#EAF7ED', color: '#2A8C38', fontWeight: 700, border: '1px solid #C8EDD0' }}
          />
        )}
      </Stack>

      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 4 }} />}

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title={t('dashboard.activePoints')}
            value={activePoints}
            icon={<GasMeterIcon fontSize="inherit" />}
            gradient="linear-gradient(135deg, #3AB54A 0%, #2A8C38 100%)"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title={t('dashboard.totalInvoices')}
            value={totalInvoices}
            icon={<ReceiptLongIcon fontSize="inherit" />}
            gradient="linear-gradient(135deg, #0B1545 0%, #162060 100%)"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title={t('dashboard.totalBilled')}
            value={totalBilled}
            format="currency"
            icon={<EuroIcon fontSize="inherit" />}
            gradient="linear-gradient(135deg, #5A8DEE 0%, #3B6CDC 100%)"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            title={t('dashboard.totalReadings')}
            value={totalReadings}
            icon={<BoltIcon fontSize="inherit" />}
            gradient="linear-gradient(135deg, #FF9800 0%, #F57C00 100%)"
            loading={loading}
          />
        </Grid>
      </Grid>

      {noData ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>{t('dashboard.noData')}</Typography>
          <Typography variant="body2" color="text.disabled">{t('dashboard.noDataHint')}</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Area chart: monthly evolution */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight={700} color="secondary.main" sx={{ mb: 0.5 }}>{t('dashboard.monthlyEvolution')}</Typography>
              <Typography variant="caption" color="text.secondary">{t('dashboard.monthlyEvolutionSub')}</Typography>
              <Box sx={{ mt: 2, height: 280 }}>
                {loading ? (
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                ) : monthlyData.length === 0 ? (
                  <Stack height={280} alignItems="center" justifyContent="center">
                    <Typography color="text.disabled">{t('dashboard.noInvoicesYet')}</Typography>
                  </Stack>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3AB54A" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3AB54A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F8" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5A6A8A' }} />
                      <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k€`} tick={{ fontSize: 11, fill: '#5A6A8A' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name={t('dashboard.billed')}
                        stroke="#3AB54A"
                        strokeWidth={3}
                        fill="url(#colorTotal)"
                        dot={{ fill: '#3AB54A', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Bar chart: by zone */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" fontWeight={700} color="secondary.main" sx={{ mb: 0.5 }}>{t('dashboard.billingByZone')}</Typography>
              <Typography variant="caption" color="text.secondary">{t('dashboard.billingByZoneSub')}</Typography>
              <Box sx={{ mt: 2, height: 280 }}>
                {loading ? (
                  <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
                ) : zoneData.length === 0 ? (
                  <Stack height={280} alignItems="center" justifyContent="center">
                    <Typography color="text.disabled">{t('dashboard.noInvoicesYet')}</Typography>
                  </Stack>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zoneData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F8" vertical={false} />
                      <XAxis dataKey="zona" tick={{ fontSize: 11, fill: '#5A6A8A' }} />
                      <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 11, fill: '#5A6A8A' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="total" name={t('dashboard.billed')} radius={[6, 6, 0, 0]} maxBarSize={60}>
                        {zoneData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={ZONE_COLORS[index % ZONE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Top CUPS table */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} color="secondary.main" sx={{ mb: 0.5 }}>{t('dashboard.topCups')}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>{t('dashboard.topCupsSub')}</Typography>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={44} sx={{ mb: 0.5, borderRadius: 1 }} />)
              ) : topCups.length === 0 ? (
                <Typography color="text.disabled" variant="body2">{t('dashboard.noInvoicesYet')}</Typography>
              ) : (
                topCups.map((row, idx) => (
                  <Box key={row.cups}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1.25 }}>
                      <Box
                        sx={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: idx === 0
                            ? 'linear-gradient(135deg, #FFD700, #FFA000)'
                            : idx === 1
                              ? 'linear-gradient(135deg, #C0C0C0, #9E9E9E)'
                              : idx === 2
                                ? 'linear-gradient(135deg, #CD7F32, #A0522D)'
                                : '#F4F6FA',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: idx < 3 ? '0 2px 6px rgba(0,0,0,0.18)' : 'none',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: idx < 3 ? '#fff' : '#5A6A8A' }}>
                          {row.rank}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.cups}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cupToZone.get(row.cups) ?? '—'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ flexShrink: 0 }}>
                        {fmtEur(row.total)}
                      </Typography>
                    </Stack>
                    {idx < topCups.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </Paper>
          </Grid>

          {/* Supply point status breakdown */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} color="secondary.main" sx={{ mb: 0.5 }}>{t('dashboard.supplyStatus')}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>{t('dashboard.supplyStatusSub')}</Typography>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={44} sx={{ mb: 1, borderRadius: 2 }} />)
              ) : (
                <>
                  {[
                    { label: 'ACTIVO', color: '#3AB54A', bg: '#EAF7ED' },
                    { label: 'INACTIVO', color: '#F44336', bg: '#FFEBEE' },
                  ].map(({ label, color, bg }) => {
                    const cnt = supplyPoints.filter((s) => s.estado === label).length;
                    const pct = supplyPoints.length > 0 ? Math.round((cnt / supplyPoints.length) * 100) : 0;
                    return (
                      <Box key={label} sx={{ mb: 2 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                            <Typography variant="body2" fontWeight={600}>{label}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={700} color="text.primary">{cnt}</Typography>
                            <Chip label={`${pct}%`} size="small" sx={{ bgcolor: bg, color, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                          </Stack>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 8, borderRadius: 4, bgcolor: '#F4F6FA',
                            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                          }}
                        />
                      </Box>
                    );
                  })}
                  <Divider sx={{ my: 2 }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">{t('dashboard.totalPoints')}</Typography>
                    <Typography variant="body2" fontWeight={800}>{supplyPoints.length}</Typography>
                  </Stack>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
