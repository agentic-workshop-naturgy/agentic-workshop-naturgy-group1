export interface TariffSimulation {
  tarifa: string;
  tipo: string;
  fijoMesEur: number;
  variableEurKwh: number;
  costeFijo: number;
  costeVariable: number;
  costoTotal: number;
  ahorro: number;
  esRecomendada: boolean;
}

export interface RecommendationResult {
  cups: string;
  zona: string;
  tarifaActual: string;
  consumoMedioM3: number;
  consumoMedioKwh: number;
  coefConv: number;
  pcsKwhM3: number;
  simulaciones: TariffSimulation[];
}
