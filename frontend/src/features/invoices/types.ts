export interface InvoiceLine {
  id: number;
  tipoLinea: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
}

export interface Invoice {
  numeroFactura: string;
  cups: string;
  periodoInicio: string;
  periodoFin: string;
  base: number;
  impuestos: number;
  total: number;
  fechaEmision: string;
  lines?: InvoiceLine[];
}

export interface InvoiceFilters {
  cups: string;
  period: string;
  fechaEmision: string;
}
