import { useState, useEffect, useCallback, useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PageHeader } from '../../shared/ui/PageHeader';
import { supplyPointsApi } from '../supplyPoints/api';
import { readingsApi } from '../readings/api';
import { tariffsApi } from '../tariffs/api';
import { conversionFactorsApi } from '../conversionFactors/api';
import type { SupplyPoint } from '../supplyPoints/types';
import type { GasReading } from '../readings/types';
import type { GasTariff } from '../tariffs/types';
import type { ConversionFactor } from '../conversionFactors/types';
import type { TariffSimulation, RecommendationResult } from './types';

const COLORS = {
  recommended: '#64BE28',
  current: '#002855',
  other: '#90A4AE',
  savings: '#4CAF50',
  extra: '#F44336',
};

export function TariffRecommenderPage() {
  const [supplyPoints, setSupplyPoints] = useState<SupplyPoint[]>([]);
  const [selectedCups, setSelectedCups] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);

  const loadSupplyPoints = useCallback(async () => {
    try {
      const data = await supplyPointsApi.getAll();
      setSupplyPoints(data.filter((sp) => sp.estado === 'ACTIVO'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar puntos de suministro');
    }
  }, []);

  useEffect(() => {
    void loadSupplyPoints();
  }, [loadSupplyPoints]);

  const computeRecommendation = useCallback(async (cups: string) => {
    if (!cups) {
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sp = (await supplyPointsApi.getAll()).find((s) => s.cups === cups);
      if (!sp) throw new Error('Punto de suministro no encontrado');

      const [readings, tariffs, factors] = await Promise.all([
        readingsApi.getAll(cups),
        tariffsApi.getAll(),
        conversionFactorsApi.getAll(sp.zona),
      ]);

      if (readings.length < 2) {
        throw new Error('Se necesitan al menos 2 lecturas para estimar el consumo');
      }

      // Sort readings by date
      const sorted = [...readings].sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      );

      // Calculate monthly consumptions in m³
      const monthlyConsumptions: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const diff = sorted[i].lecturaM3 - sorted[i - 1].lecturaM3;
        if (diff >= 0) monthlyConsumptions.push(diff);
      }

      if (monthlyConsumptions.length === 0) {
        throw new Error('No se pudieron calcular consumos válidos');
      }

      const avgM3 = monthlyConsumptions.reduce((a, b) => a + b, 0) / monthlyConsumptions.length;

      // Get latest conversion factor for zone
      const latestFactor = factors.length > 0
        ? factors.sort((a, b) => b.mes.localeCompare(a.mes))[0]
        : null;

      const coefConv = latestFactor?.coefConv ?? 1.0;
      const pcsKwhM3 = latestFactor?.pcsKwhM3 ?? 11.0;
      const avgKwh = avgM3 * coefConv * pcsKwhM3;

      // Filter tariffs matching the supply point type (GAS or COMBINADA based on current tariff)
      const currentTariff = tariffs.find((t) => t.tarifa === sp.tarifa);
      const isDual = currentTariff?.tipo === 'COMBINADA' || sp.tarifa.includes('DUAL');
      const applicableTariffs = tariffs.filter((t) =>
        isDual ? t.tipo === 'COMBINADA' : t.tipo === 'GAS',
      );

      // Simulate cost for each tariff
      const simulations: TariffSimulation[] = applicableTariffs.map((t) => {
        const costeFijo = t.fijoMesEur;
        const costeVariable = roundMoney(avgKwh * t.variableEurKwh);
        const costoTotal = roundMoney(costeFijo + costeVariable);
        return {
          tarifa: t.tarifa,
          tipo: t.tipo,
          fijoMesEur: t.fijoMesEur,
          variableEurKwh: t.variableEurKwh,
          costeFijo,
          costeVariable,
          costoTotal,
          ahorro: 0,
          esRecomendada: false,
        };
      });

      // Sort by total cost
      simulations.sort((a, b) => a.costoTotal - b.costoTotal);

      // Calculate savings relative to current tariff
      const currentSim = simulations.find((s) => s.tarifa === sp.tarifa);
      const currentCost = currentSim?.costoTotal ?? simulations[0]?.costoTotal ?? 0;

      for (const sim of simulations) {
        sim.ahorro = roundMoney(currentCost - sim.costoTotal);
      }

      // Mark cheapest as recommended
      if (simulations.length > 0) {
        simulations[0].esRecomendada = true;
      }

      setResult({
        cups,
        zona: sp.zona,
        tarifaActual: sp.tarifa,
        consumoMedioM3: roundMoney(avgM3),
        consumoMedioKwh: Math.round(avgKwh * 1000) / 1000,
        coefConv,
        pcsKwhM3,
        simulaciones: simulations,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al calcular recomendación');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void computeRecommendation(selectedCups);
  }, [selectedCups, computeRecommendation]);

  const recommended = result?.simulaciones.find((s) => s.esRecomendada);
  const currentIsOptimal = recommended?.tarifa === result?.tarifaActual;

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.simulaciones.map((s) => ({
      tarifa: s.tarifa,
      costoTotal: s.costoTotal,
      esRecomendada: s.esRecomendada,
      esActual: s.tarifa === result.tarifaActual,
    }));
  }, [result]);

  return (
    <Box>
      <PageHeader title="Recomendador de Tarifa" />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 360 }}>
            <InputLabel>Punto de Suministro (CUPS)</InputLabel>
            <Select
              value={selectedCups}
              label="Punto de Suministro (CUPS)"
              onChange={(e) => setSelectedCups(e.target.value)}
            >
              <MenuItem value="">
                <em>Seleccionar...</em>
              </MenuItem>
              {supplyPoints.map((sp) => (
                <MenuItem key={sp.cups} value={sp.cups}>
                  {sp.cups} — {sp.zona} ({sp.tarifa})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Seleccione un punto de suministro para calcular la tarifa más económica basándose en su consumo histórico">
            <InfoOutlinedIcon color="action" />
          </Tooltip>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {result && (
        <>
          {/* Summary cards */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <StatCard label="CUPS" value={result.cups} color={COLORS.current} />
            <StatCard label="Zona" value={result.zona} color="#1A4A7A" />
            <StatCard label="Tarifa Actual" value={result.tarifaActual} color="#F39200" />
            <StatCard
              label="Consumo Medio"
              value={`${result.consumoMedioM3.toFixed(2)} m³`}
              color={COLORS.current}
            />
            <StatCard
              label="Consumo Medio"
              value={`${result.consumoMedioKwh.toFixed(3)} kWh`}
              color="#64BE28"
            />
          </Stack>

          {/* Recommendation banner */}
          {recommended && (
            <Paper
              sx={{
                p: 2.5,
                mb: 3,
                bgcolor: currentIsOptimal ? '#E8F5E9' : '#FFF3E0',
                border: `1px solid ${currentIsOptimal ? '#A5D6A7' : '#FFB74D'}`,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <EmojiEventsIcon
                  sx={{ fontSize: 40, color: currentIsOptimal ? COLORS.savings : '#F39200' }}
                />
                <Box>
                  {currentIsOptimal ? (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                        ¡Su tarifa actual es la más económica!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        La tarifa <strong>{result.tarifaActual}</strong> es la opción más
                        económica para su consumo medio de{' '}
                        <strong>{result.consumoMedioKwh.toFixed(3)} kWh/mes</strong>.
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#E65100' }}>
                        Recomendación: cambiar a tarifa {recommended.tarifa}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Podría ahorrar <strong>{recommended.ahorro.toFixed(2)} €/mes</strong>{' '}
                        ({(recommended.ahorro * 12).toFixed(2)} €/año) cambiando de{' '}
                        <strong>{result.tarifaActual}</strong> a{' '}
                        <strong>{recommended.tarifa}</strong>.
                      </Typography>
                    </>
                  )}
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Cost comparison chart */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Comparativa de Coste Mensual Estimado (€)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="tarifa" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{ value: '€/mes', angle: -90, position: 'insideLeft' }}
                />
                <RechartsTooltip
                  formatter={(value: number) => [`${value.toFixed(2)} €`, 'Coste estimado']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
                />
                <Bar dataKey="costoTotal" name="Coste Mensual (€)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.esRecomendada
                          ? COLORS.recommended
                          : entry.esActual
                            ? COLORS.current
                            : COLORS.other
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Stack direction="row" spacing={2} sx={{ mt: 1, justifyContent: 'center' }}>
              <Chip size="small" sx={{ bgcolor: COLORS.recommended, color: '#fff' }} label="Recomendada" />
              <Chip size="small" sx={{ bgcolor: COLORS.current, color: '#fff' }} label="Actual" />
              <Chip size="small" sx={{ bgcolor: COLORS.other, color: '#fff' }} label="Otras" />
            </Stack>
          </Paper>

          {/* Detailed table */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Detalle por Tarifa
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Tarifa</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Fijo (€/mes)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Variable (€/kWh)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Coste Fijo</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Coste Variable</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Total (€/mes)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Ahorro (€/mes)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.simulaciones.map((sim) => {
                    const isActual = sim.tarifa === result.tarifaActual;
                    return (
                      <TableRow
                        key={sim.tarifa}
                        sx={{
                          bgcolor: sim.esRecomendada
                            ? 'rgba(100, 190, 40, 0.08)'
                            : isActual
                              ? 'rgba(0, 40, 85, 0.04)'
                              : undefined,
                        }}
                      >
                        <TableCell sx={{ fontWeight: sim.esRecomendada || isActual ? 600 : 400 }}>
                          {sim.tarifa}
                        </TableCell>
                        <TableCell>{sim.tipo}</TableCell>
                        <TableCell align="right">{sim.fijoMesEur.toFixed(2)}</TableCell>
                        <TableCell align="right">{sim.variableEurKwh.toFixed(4)}</TableCell>
                        <TableCell align="right">{sim.costeFijo.toFixed(2)} €</TableCell>
                        <TableCell align="right">{sim.costeVariable.toFixed(2)} €</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {sim.costoTotal.toFixed(2)} €
                        </TableCell>
                        <TableCell align="right">
                          {sim.ahorro > 0 ? (
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                              <TrendingDownIcon sx={{ fontSize: 16, color: COLORS.savings }} />
                              <Typography variant="body2" sx={{ color: COLORS.savings, fontWeight: 600 }}>
                                {sim.ahorro.toFixed(2)} €
                              </Typography>
                            </Stack>
                          ) : sim.ahorro < 0 ? (
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                              <TrendingUpIcon sx={{ fontSize: 16, color: COLORS.extra }} />
                              <Typography variant="body2" sx={{ color: COLORS.extra }}>
                                +{Math.abs(sim.ahorro).toFixed(2)} €
                              </Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {sim.esRecomendada && (
                            <Chip
                              size="small"
                              icon={<EmojiEventsIcon />}
                              label="Recomendada"
                              sx={{ bgcolor: COLORS.recommended, color: '#fff', '& .MuiChip-icon': { color: '#fff' } }}
                            />
                          )}
                          {isActual && !sim.esRecomendada && (
                            <Chip size="small" label="Actual" color="primary" variant="outlined" />
                          )}
                          {isActual && sim.esRecomendada && (
                            <Chip
                              size="small"
                              label="Actual"
                              sx={{ ml: 0.5 }}
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, p: 2, bgcolor: '#F5F5F5', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                * Estimación basada en el consumo medio histórico ({result.consumoMedioM3.toFixed(2)} m³/mes ≈{' '}
                {result.consumoMedioKwh.toFixed(3)} kWh/mes) con factor de conversión {result.coefConv} y PCS{' '}
                {result.pcsKwhM3} kWh/m³. Los costes no incluyen impuestos (IVA). El ahorro real puede variar
                según el consumo futuro.
              </Typography>
            </Box>
          </Paper>
        </>
      )}

      {!selectedCups && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Seleccione un punto de suministro activo para obtener una recomendación de tarifa.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Paper sx={{ p: 2, flex: 1, borderTop: `3px solid ${color}`, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.95rem', mt: 0.5 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
