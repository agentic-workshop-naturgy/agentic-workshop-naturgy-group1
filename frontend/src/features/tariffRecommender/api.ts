import * as http from '../../shared/api/httpClient';
import type { TariffRecommendation } from './types';

export const tariffRecommenderApi = {
  getAll: (): Promise<TariffRecommendation[]> =>
    http.get<TariffRecommendation[]>('/tariff-recommendations'),
  getByCups: (cups: string): Promise<TariffRecommendation> =>
    http.get<TariffRecommendation>(`/tariff-recommendations/${encodeURIComponent(cups)}`),
};
