export interface Tax {
  taxCode: string;
  taxRate: number;
  vigenciaDesde: string;
}

export interface TaxForm {
  taxCode: string;
  taxRate: string;
  vigenciaDesde: string;
}
