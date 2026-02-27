export interface ConversionFactor {
  id: number;
  zona: string;
  mes: string;
  coefConv: number;
  pcsKwhM3: number;
}

export interface ConversionFactorForm {
  zona: string;
  mes: string;
  coefConv: string;
  pcsKwhM3: string;
}
