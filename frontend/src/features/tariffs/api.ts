import * as http from '../../shared/api/httpClient';
import type { GasTariff } from './types';

export const tariffsApi = {
  getAll: (): Promise<GasTariff[]> => http.get<GasTariff[]>('/tariffs'),
  create: (data: GasTariff): Promise<GasTariff> =>
    http.post<GasTariff>('/tariffs', data),
  update: (tarifa: string, data: GasTariff): Promise<GasTariff> =>
    http.put<GasTariff>(`/tariffs/${encodeURIComponent(tarifa)}`, data),
  delete: (tarifa: string): Promise<void> =>
    http.del(`/tariffs/${encodeURIComponent(tarifa)}`),
};
