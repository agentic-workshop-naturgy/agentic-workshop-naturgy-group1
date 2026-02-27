import * as http from '../../shared/api/httpClient';
import type { Invoice } from './types';

export const invoicesApi = {
  getAll: (cups?: string, period?: string, fechaEmision?: string): Promise<Invoice[]> => {
    const params = new URLSearchParams();
    if (cups) params.set('cups', cups);
    if (period) params.set('period', period);
    if (fechaEmision) params.set('fechaEmision', fechaEmision);
    const query = params.toString() ? `?${params.toString()}` : '';
    return http.get<Invoice[]>(`/invoices${query}`);
  },
  getOne: (invoiceId: string): Promise<Invoice> =>
    http.get<Invoice>(`/invoices/${encodeURIComponent(invoiceId)}`),
  downloadPdf: (invoiceId: string): Promise<Blob> =>
    http.getBlob(`/invoices/${encodeURIComponent(invoiceId)}/pdf`),
};
