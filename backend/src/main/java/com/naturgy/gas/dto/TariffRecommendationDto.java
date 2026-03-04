package com.naturgy.gas.dto;

import java.math.BigDecimal;
import java.util.List;

public record TariffRecommendationDto(
        String cups,
        String zona,
        String currentTariff,
        String recommendedTariff,
        BigDecimal currentMonthlyCostEur,
        BigDecimal recommendedMonthlyCostEur,
        BigDecimal monthlySavingsEur,
        BigDecimal annualSavingsEur,
        boolean isOptimal,
        int periodsAnalyzed,
        List<TariffComparisonDto> comparisons
) {
    public record TariffComparisonDto(
            String tarifa,
            BigDecimal avgMonthlyCostEur,
            BigDecimal fixedCostEur,
            BigDecimal variableCostEur
    ) {}
}
