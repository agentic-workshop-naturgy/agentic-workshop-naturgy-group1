export interface SupplyPoint {
  cups: string;
  zona: string;
  tarifa: string;
  estado: 'ACTIVO' | 'INACTIVO';
  servigas: boolean;
  contratoDual: boolean;
}

export interface SupplyPointForm {
  cups: string;
  zona: string;
  tarifa: string;
  estado: 'ACTIVO' | 'INACTIVO';
  servigas: boolean;
  contratoDual: boolean;
}

export const ESTADO_OPTIONS: Array<'ACTIVO' | 'INACTIVO'> = ['ACTIVO', 'INACTIVO'];
