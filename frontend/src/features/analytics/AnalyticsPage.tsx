import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PageHeader } from '../../shared/ui/PageHeader';
import { NATURGY } from '../../app/theme';
import { fetchAnalyticsData } from './api';
import type { ConsumptionBySupplyPoint, ConsumptionOverTime, TariffStats } from './types';

const CHART_COLORS = [
  NATURGY.orange,
  NATURGY.blue,
  NATURGY.orangeLight,
  NATURGY.blueLight,
  '#27ae60',
  '#8e44ad',
  '#e74c3c',
  '#16a085',
  '#f39c12',
  '#2980b9',
];

export function AnalyticsPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consumptionBySupplyPoint, setConsumptionBySupplyPoint] = useState<ConsumptionBySupplyPoint[]>([]);
  const [consumptionOverTime, setConsumptionOverTime] = useState<ConsumptionOverTime[]>([]);
  const [tariffStats, setTariffStats] = useState<TariffStats[]>([]);
  const [selectedCups, setSelectedCups] = useState<string>('__all__');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAnalyticsData();
      setConsumptionBySupplyPoint(data.consumptionBySupplyPoint);
      setConsumptionOverTime(data.consumptionOverTime);
      setTariffStats(data.tariffStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // List of unique CUPS for the filter
  const cupsList = useMemo(
    () => consumptionBySupplyPoint.map((c) => c.cups),
    [consumptionBySupplyPoint],
  );

  // Filtered time-series data
  const filteredTimeSeries = useMemo(() => {
    if (selectedCups === '__all__') return consumptionOverTime;
    return consumptionOverTime.filter((r) => r.cups === selectedCups);
  }, [consumptionOverTime, selectedCups]);

  // Aggregate time series by date for the line chart
  const aggregatedTimeSeries = useMemo(() => {
    const map = new Map<string, number>();
    filteredTimeSeries.forEach((r) => {
      map.set(r.fecha, (map.get(r.fecha) ?? 0) + r.lecturaM3);
    });
    return Array.from(map.entries())
      .map(([fecha, lecturaM3]) => ({ fecha, lecturaM3: Math.round(lecturaM3 * 100) / 100 }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [filteredTimeSeries]);

  // Pie chart data – distribution of total consumption by tariff
  const tariffPieData = useMemo(
    () => tariffStats.map((ts) => ({ name: ts.tarifa, value: ts.totalM3 })),
    [tariffStats],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title={t('analytics.title')} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Summary cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {t('analytics.totalSupplyPoints')}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {consumptionBySupplyPoint.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {t('analytics.totalReadings')}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {consumptionOverTime.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {t('analytics.totalConsumption')}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {consumptionBySupplyPoint
                  .reduce((sum, c) => sum + c.totalM3, 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                m³
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Consumption by supply point (bar chart) ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {t('analytics.consumptionBySupplyPoint')}
        </Typography>
        {consumptionBySupplyPoint.length === 0 ? (
          <Typography color="text.secondary">{t('common.noData')}</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={consumptionBySupplyPoint} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cups" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value) => [`${value} m³`, t('analytics.totalConsumption')]}
              />
              <Legend />
              <Bar
                dataKey="totalM3"
                name={t('analytics.totalM3')}
                fill={NATURGY.orange}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="avgM3"
                name={t('analytics.avgM3')}
                fill={NATURGY.blue}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* ── Consumption over time (line chart) ── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6" fontWeight={600} sx={{ flexGrow: 1 }}>
            {t('analytics.consumptionOverTime')}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>{t('analytics.filterByCups')}</InputLabel>
            <Select
              value={selectedCups}
              label={t('analytics.filterByCups')}
              onChange={(e) => setSelectedCups(e.target.value)}
            >
              <MenuItem value="__all__">{t('analytics.allSupplyPoints')}</MenuItem>
              {cupsList.map((cups) => (
                <MenuItem key={cups} value={cups}>
                  {cups}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {aggregatedTimeSeries.length === 0 ? (
          <Typography color="text.secondary">{t('common.noData')}</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={aggregatedTimeSeries} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${value} m³`]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="lecturaM3"
                name={t('analytics.readingM3')}
                stroke={NATURGY.orange}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* ── Tariff Stats section ── */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        {t('analytics.tariffAnalysis')}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Pie chart – consumption distribution by tariff */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              {t('analytics.distributionByTariff')}
            </Typography>
            {tariffPieData.length === 0 ? (
              <Typography color="text.secondary">{t('common.noData')}</Typography>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tariffPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(1)}%)`}
                  >
                    {tariffPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} m³`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Statistics table by tariff */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              {t('analytics.statisticsByTariff')}
            </Typography>
            {tariffStats.length === 0 ? (
              <Typography color="text.secondary">{t('common.noData')}</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t('analytics.tariff')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {t('analytics.supplyPoints')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {t('analytics.readings')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {t('analytics.totalM3')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {t('analytics.avgM3')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {t('analytics.minM3')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {t('analytics.maxM3')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {t('analytics.stdDev')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tariffStats.map((ts) => (
                      <TableRow key={ts.tarifa} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{ts.tarifa}</TableCell>
                        <TableCell align="right">{ts.supplyPointCount}</TableCell>
                        <TableCell align="right">{ts.totalReadings}</TableCell>
                        <TableCell align="right">{ts.totalM3.toLocaleString()}</TableCell>
                        <TableCell align="right">{ts.avgM3.toLocaleString()}</TableCell>
                        <TableCell align="right">{ts.minM3.toLocaleString()}</TableCell>
                        <TableCell align="right">{ts.maxM3.toLocaleString()}</TableCell>
                        <TableCell align="right">{ts.stdDevM3.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
