import * as http from '../../shared/api/httpClient';
import type { BillingResult } from './types';

export const billingApi = {
  run: (period: string): Promise<BillingResult> =>
    http.post<BillingResult>(`/billing/run?period=${encodeURIComponent(period)}`, {}),
};
