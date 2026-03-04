import { readingsApi } from '../readings/api';
import { supplyPointsApi } from '../supplyPoints/api';
import type { GasReading } from '../readings/types';
import type { SupplyPoint } from '../supplyPoints/types';
import type { ConsumptionBySupplyPoint, ConsumptionOverTime, TariffStats } from './types';

function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

export async function fetchAnalyticsData(): Promise<{
  supplyPoints: SupplyPoint[];
  readings: GasReading[];
  consumptionBySupplyPoint: ConsumptionBySupplyPoint[];
  consumptionOverTime: ConsumptionOverTime[];
  tariffStats: TariffStats[];
}> {
  const [supplyPoints, readings] = await Promise.all([
    supplyPointsApi.getAll(),
    readingsApi.getAll(),
  ]);

  const spMap = new Map<string, SupplyPoint>();
  supplyPoints.forEach((sp) => spMap.set(sp.cups, sp));

  // --- Consumption by supply point ---
  const cupsGroup = new Map<string, GasReading[]>();
  readings.forEach((r) => {
    const list = cupsGroup.get(r.cups) ?? [];
    list.push(r);
    cupsGroup.set(r.cups, list);
  });

  const consumptionBySupplyPoint: ConsumptionBySupplyPoint[] = [];
  cupsGroup.forEach((rds, cups) => {
    const sp = spMap.get(cups);
    const totalM3 = rds.reduce((sum, r) => sum + r.lecturaM3, 0);
    consumptionBySupplyPoint.push({
      cups,
      tarifa: sp?.tarifa ?? '—',
      zona: sp?.zona ?? '—',
      totalM3: Math.round(totalM3 * 100) / 100,
      readingsCount: rds.length,
      avgM3: Math.round((totalM3 / rds.length) * 100) / 100,
    });
  });
  consumptionBySupplyPoint.sort((a, b) => b.totalM3 - a.totalM3);

  // --- Consumption over time (sorted by date) ---
  const consumptionOverTime: ConsumptionOverTime[] = readings
    .map((r) => ({ fecha: r.fecha, lecturaM3: r.lecturaM3, cups: r.cups }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // --- Stats by tariff ---
  const tariffGroup = new Map<string, { cupsSet: Set<string>; values: number[] }>();
  readings.forEach((r) => {
    const sp = spMap.get(r.cups);
    const tarifa = sp?.tarifa ?? 'Sin tarifa';
    const entry = tariffGroup.get(tarifa) ?? { cupsSet: new Set(), values: [] };
    entry.cupsSet.add(r.cups);
    entry.values.push(r.lecturaM3);
    tariffGroup.set(tarifa, entry);
  });

  const tariffStats: TariffStats[] = [];
  tariffGroup.forEach((entry, tarifa) => {
    const totalM3 = entry.values.reduce((a, b) => a + b, 0);
    const avgM3 = totalM3 / entry.values.length;
    tariffStats.push({
      tarifa,
      supplyPointCount: entry.cupsSet.size,
      totalReadings: entry.values.length,
      totalM3: Math.round(totalM3 * 100) / 100,
      avgM3: Math.round(avgM3 * 100) / 100,
      minM3: Math.round(Math.min(...entry.values) * 100) / 100,
      maxM3: Math.round(Math.max(...entry.values) * 100) / 100,
      stdDevM3: Math.round(stdDev(entry.values, avgM3) * 100) / 100,
    });
  });
  tariffStats.sort((a, b) => b.totalM3 - a.totalM3);

  return { supplyPoints, readings, consumptionBySupplyPoint, consumptionOverTime, tariffStats };
}
