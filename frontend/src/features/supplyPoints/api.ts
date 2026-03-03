import * as http from '../../shared/api/httpClient';
import type { SupplyPoint, SupplyPointForm } from './types';

export const supplyPointsApi = {
  getAll: (): Promise<SupplyPoint[]> => http.get<SupplyPoint[]>('/supply-points'),
  create: (data: SupplyPointForm): Promise<SupplyPoint> =>
    http.post<SupplyPoint>('/supply-points', data),
  update: (cups: string, data: SupplyPointForm): Promise<SupplyPoint> =>
    http.put<SupplyPoint>(`/supply-points/${encodeURIComponent(cups)}`, data),
  delete: (cups: string): Promise<void> =>
    http.del(`/supply-points/${encodeURIComponent(cups)}`),
};
