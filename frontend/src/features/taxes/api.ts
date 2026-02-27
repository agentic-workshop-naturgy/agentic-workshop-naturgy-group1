import * as http from '../../shared/api/httpClient';
import type { Tax } from './types';

export const taxesApi = {
  getAll: (): Promise<Tax[]> => http.get<Tax[]>('/taxes'),
  create: (data: Tax): Promise<Tax> => http.post<Tax>('/taxes', data),
  update: (taxCode: string, data: Tax): Promise<Tax> =>
    http.put<Tax>(`/taxes/${encodeURIComponent(taxCode)}`, data),
  delete: (taxCode: string): Promise<void> =>
    http.del(`/taxes/${encodeURIComponent(taxCode)}`),
};
