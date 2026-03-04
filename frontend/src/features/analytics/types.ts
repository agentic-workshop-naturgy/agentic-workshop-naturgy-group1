export interface ConsumptionBySupplyPoint {
  cups: string;
  tarifa: string;
  zona: string;
  totalM3: number;
  readingsCount: number;
  avgM3: number;
}

export interface ConsumptionOverTime {
  fecha: string;
  lecturaM3: number;
  cups: string;
}

export interface TariffStats {
  tarifa: string;
  supplyPointCount: number;
  totalReadings: number;
  totalM3: number;
  avgM3: number;
  minM3: number;
  maxM3: number;
  stdDevM3: number;
}
