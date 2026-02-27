import * as http from '../../shared/api/httpClient';
import type { ConversionFactor } from './types';

export const conversionFactorsApi = {
  getAll: (zona?: string, mes?: string): Promise<ConversionFactor[]> => {
    const params = new URLSearchParams();
    if (zona) params.set('zona', zona);
    if (mes) params.set('mes', mes);
    const query = params.toString() ? `?${params.toString()}` : '';
    return http.get<ConversionFactor[]>(`/conversion-factors${query}`);
  },
  create: (data: Omit<ConversionFactor, 'id'>): Promise<ConversionFactor> =>
    http.post<ConversionFactor>('/conversion-factors', data),
  update: (id: number, data: Omit<ConversionFactor, 'id'>): Promise<ConversionFactor> =>
    http.put<ConversionFactor>(`/conversion-factors/${id}`, data),
  delete: (id: number): Promise<void> => http.del(`/conversion-factors/${id}`),
};
