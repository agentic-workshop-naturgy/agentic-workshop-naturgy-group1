import * as http from '../../shared/api/httpClient';
import type { GasReading } from './types';

export const readingsApi = {
  getAll: (cups?: string): Promise<GasReading[]> => {
    const query = cups ? `?cups=${encodeURIComponent(cups)}` : '';
    return http.get<GasReading[]>(`/readings${query}`);
  },
  create: (data: Omit<GasReading, 'id'>): Promise<GasReading> =>
    http.post<GasReading>('/readings', data),
  update: (id: number, data: Omit<GasReading, 'id'>): Promise<GasReading> =>
    http.put<GasReading>(`/readings/${id}`, data),
  delete: (id: number): Promise<void> => http.del(`/readings/${id}`),
};
