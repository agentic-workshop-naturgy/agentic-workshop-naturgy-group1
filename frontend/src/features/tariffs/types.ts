export interface GasTariff {
  tarifa: string;
  fijoMesEur: number;
  variableEurKwh: number;
  vigenciaDesde: string;
}

export interface GasTariffForm {
  tarifa: string;
  fijoMesEur: string;
  variableEurKwh: string;
  vigenciaDesde: string;
}
