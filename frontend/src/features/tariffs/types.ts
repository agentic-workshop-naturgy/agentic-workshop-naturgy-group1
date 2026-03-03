export type TipoTarifa = 'GAS' | 'COMBINADA';

export interface GasTariff {
  tarifa: string;
  fijoMesEur: number;
  variableEurKwh: number;
  vigenciaDesde: string;
  tipo: TipoTarifa;
}

export interface GasTariffForm {
  tarifa: string;
  fijoMesEur: string;
  variableEurKwh: string;
  vigenciaDesde: string;
  tipo: TipoTarifa;
}
