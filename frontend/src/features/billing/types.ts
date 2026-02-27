export interface BillingResult {
  period: string;
  invoicesCreated: number;
  invoicesUpdated: number;
  errors: BillingError[];
}

export interface BillingError {
  cups: string;
  error: string;
}
