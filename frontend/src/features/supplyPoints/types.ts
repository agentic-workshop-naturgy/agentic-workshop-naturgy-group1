export interface SupplyPoint {
  cups: string;
  zona: string;
  tarifa: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface SupplyPointForm {
  cups: string;
  zona: string;
  tarifa: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export const ESTADO_OPTIONS: Array<'ACTIVO' | 'INACTIVO'> = ['ACTIVO', 'INACTIVO'];
