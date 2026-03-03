export interface SupplyPoint {
  cups: string;
  zona: string;
  tarifa: string;
  estado: 'ACTIVO' | 'INACTIVO';
  clienteId: number | null;
  calle: string | null;
  numero: string | null;
  piso: string | null;
  codigoPostal: string | null;
  municipio: string | null;
  provincia: string | null;
}

export interface SupplyPointForm {
  cups: string;
  zona: string;
  tarifa: string;
  estado: 'ACTIVO' | 'INACTIVO';
  clienteId: number | null;
  calle: string;
  numero: string;
  piso: string;
  codigoPostal: string;
  municipio: string;
  provincia: string;
}

export const ESTADO_OPTIONS: Array<'ACTIVO' | 'INACTIVO'> = ['ACTIVO', 'INACTIVO'];

