export interface TariffComparison {
  tarifa: string;
  avgMonthlyCostEur: number;
  fixedCostEur: number;
  variableCostEur: number;
}

export interface TariffRecommendation {
  cups: string;
  zona: string;
  currentTariff: string;
  recommendedTariff: string;
  currentMonthlyCostEur: number;
  recommendedMonthlyCostEur: number;
  monthlySavingsEur: number;
  annualSavingsEur: number;
  isOptimal: boolean;
  periodsAnalyzed: number;
  comparisons: TariffComparison[];
}
