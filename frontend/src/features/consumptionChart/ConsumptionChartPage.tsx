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
import Typography from '@mui/material/Typography';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { PageHeader } from '../../shared/ui/PageHeader';
import { readingsApi } from '../readings/api';
import { supplyPointsApi } from '../supplyPoints/api';
import type { GasReading } from '../readings/types';
import type { SupplyPoint } from '../supplyPoints/types';

type ChartType = 'bar' | 'line';

interface ConsumptionDataPoint {
  fecha: string;
  consumoM3: number;
  lecturaM3: number;
  tipo: string;
}

const CHART_COLORS = ['#002855', '#64BE28', '#F39200', '#1A4A7A', '#7ED348', '#C47600'];

export function ConsumptionChartPage() {
  const [supplyPoints, setSupplyPoints] = useState<SupplyPoint[]>([]);
  const [readings, setReadings] = useState<GasReading[]>([]);
  const [selectedCups, setSelectedCups] = useState<string>('');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSupplyPoints = useCallback(async () => {
    try {
      const data = await supplyPointsApi.getAll();
      setSupplyPoints(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar puntos de suministro');
    }
  }, []);

  useEffect(() => {
    void loadSupplyPoints();
  }, [loadSupplyPoints]);

  const loadReadings = useCallback(async (cups: string) => {
    if (!cups) {
      setReadings([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await readingsApi.getAll(cups);
      setReadings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar lecturas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReadings(selectedCups);
  }, [selectedCups, loadReadings]);

  const consumptionData = useMemo<ConsumptionDataPoint[]>(() => {
    if (readings.length === 0) return [];

    const sorted = [...readings].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    return sorted.map((reading, index) => {
      const consumo =
        index === 0 ? 0 : Math.max(0, reading.lecturaM3 - sorted[index - 1].lecturaM3);
      return {
        fecha: formatDate(reading.fecha),
        consumoM3: Math.round(consumo * 100) / 100,
        lecturaM3: reading.lecturaM3,
        tipo: reading.tipo,
      };
    });
  }, [readings]);

  const totalConsumo = useMemo(
    () => consumptionData.reduce((sum, d) => sum + d.consumoM3, 0),
    [consumptionData],
  );

  const avgConsumo = useMemo(
    () =>
      consumptionData.length > 1
        ? totalConsumo / (consumptionData.length - 1)
        : 0,
    [consumptionData, totalConsumo],
  );

  const selectedPoint = supplyPoints.find((sp) => sp.cups === selectedCups);

  return (
    <Box>
      <PageHeader title="Consumo por Punto de Suministro" />

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
                  {sp.cups} — {sp.zona} ({sp.estado})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Tipo de gráfico</InputLabel>
            <Select
              value={chartType}
              label="Tipo de gráfico"
              onChange={(e) => setChartType(e.target.value as ChartType)}
            >
              <MenuItem value="bar">Barras</MenuItem>
              <MenuItem value="line">Líneas</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {selectedCups && selectedPoint && consumptionData.length > 0 && (
        <>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <StatCard
              label="CUPS"
              value={selectedCups}
              color="#002855"
            />
            <StatCard
              label="Tarifa"
              value={selectedPoint.tarifa}
              color="#1A4A7A"
            />
            <StatCard
              label="Consumo Total"
              value={`${totalConsumo.toFixed(2)} m³`}
              color="#64BE28"
            />
            <StatCard
              label="Consumo Medio"
              value={`${avgConsumo.toFixed(2)} m³`}
              color="#F39200"
            />
            <StatCard
              label="Lecturas"
              value={String(readings.length)}
              color="#002855"
            />
          </Stack>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Consumo (m³) por Período
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'bar' ? (
                <BarChart data={consumptionData.slice(1)} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 12 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{ value: 'm³', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} m³`, 'Consumo']}
                    labelFormatter={(label: string) => `Período: ${label}`}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="consumoM3"
                    name="Consumo (m³)"
                    fill={CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={consumptionData.slice(1)} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 12 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    label={{ value: 'm³', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} m³`, 'Consumo']}
                    labelFormatter={(label: string) => `Período: ${label}`}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="consumoM3"
                    name="Consumo (m³)"
                    stroke={CHART_COLORS[1]}
                    strokeWidth={2}
                    dot={{ r: 5, fill: CHART_COLORS[1] }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Lecturas Acumuladas (m³)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={consumptionData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 12 }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{ value: 'm³', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} m³`, 'Lectura']}
                  labelFormatter={(label: string) => `Fecha: ${label}`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="lecturaM3"
                  name="Lectura Acumulada (m³)"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                  dot={(props: { cx: number; cy: number; index: number }) => {
                    const point = consumptionData[props.index];
                    const isEstimada = point?.tipo === 'ESTIMADA';
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={5}
                        fill={isEstimada ? CHART_COLORS[2] : CHART_COLORS[0]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            <Stack direction="row" spacing={2} sx={{ mt: 1, justifyContent: 'center' }}>
              <Chip
                size="small"
                sx={{ bgcolor: CHART_COLORS[0], color: '#fff' }}
                label="Lectura Real"
              />
              <Chip
                size="small"
                sx={{ bgcolor: CHART_COLORS[2], color: '#fff' }}
                label="Lectura Estimada"
              />
            </Stack>
          </Paper>
        </>
      )}

      {selectedCups && !loading && consumptionData.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No hay lecturas disponibles para este punto de suministro.
          </Typography>
        </Paper>
      )}

      {!selectedCups && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Seleccione un punto de suministro para ver su gráfico de consumo.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Paper
      sx={{
        p: 2,
        flex: 1,
        borderTop: `3px solid ${color}`,
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.95rem', mt: 0.5 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
}
