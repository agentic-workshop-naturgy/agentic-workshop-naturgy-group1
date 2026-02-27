export interface GasReading {
  id: number;
  cups: string;
  fecha: string;
  lecturaM3: number;
  tipo: 'REAL' | 'ESTIMADA';
}

export interface GasReadingForm {
  cups: string;
  fecha: string;
  lecturaM3: string;
  tipo: 'REAL' | 'ESTIMADA';
}

export const TIPO_OPTIONS: Array<'REAL' | 'ESTIMADA'> = ['REAL', 'ESTIMADA'];
