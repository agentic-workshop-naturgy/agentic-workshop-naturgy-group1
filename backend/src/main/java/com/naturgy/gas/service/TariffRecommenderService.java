package com.naturgy.gas.service;

import com.naturgy.gas.dto.TariffRecommendationDto;
import com.naturgy.gas.dto.TariffRecommendationDto.TariffComparisonDto;
import com.naturgy.gas.entity.*;
import com.naturgy.gas.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TariffRecommenderService {

    private static final Logger log = LoggerFactory.getLogger(TariffRecommenderService.class);

    private final SupplyPointRepository supplyPointRepository;
    private final GasReadingRepository gasReadingRepository;
    private final GasTariffRepository gasTariffRepository;
    private final GasConversionFactorRepository gasConversionFactorRepository;

    /**
     * Analyzes all active supply points and recommends the optimal tariff
     * based on historical consumption data.
     */
    @Transactional(readOnly = true)
    public List<TariffRecommendationDto> getRecommendations() {
        List<SupplyPoint> activePoints = supplyPointRepository.findByEstado(SupplyPoint.EstadoSupply.ACTIVO);
        List<GasTariff> allTariffs = gasTariffRepository.findAll();

        if (allTariffs.isEmpty()) {
            return Collections.emptyList();
        }

        // Group tariffs by code to get the latest effective version
        Map<String, GasTariff> latestTariffs = new LinkedHashMap<>();
        allTariffs.stream()
                .sorted(Comparator.comparing(GasTariff::getVigenciaDesde).reversed())
                .forEach(t -> latestTariffs.putIfAbsent(t.getTarifa(), t));

        List<TariffRecommendationDto> recommendations = new ArrayList<>();

        for (SupplyPoint sp : activePoints) {
            try {
                TariffRecommendationDto rec = analyzeSupplyPoint(sp, latestTariffs);
                if (rec != null) {
                    recommendations.add(rec);
                }
            } catch (Exception e) {
                log.warn("Cannot analyze CUPS {}: {}", sp.getCups(), e.getMessage());
            }
        }

        // Sort: non-optimal first (bigger savings first), then optimal
        recommendations.sort(Comparator
                .comparing(TariffRecommendationDto::isOptimal)
                .thenComparing(Comparator.comparing(TariffRecommendationDto::annualSavingsEur).reversed()));

        return recommendations;
    }

    /**
     * Analyzes a single supply point by CUPS.
     */
    @Transactional(readOnly = true)
    public TariffRecommendationDto getRecommendation(String cups) {
        SupplyPoint sp = supplyPointRepository.findById(cups)
                .orElseThrow(() -> new IllegalArgumentException("Supply point not found: " + cups));

        List<GasTariff> allTariffs = gasTariffRepository.findAll();
        Map<String, GasTariff> latestTariffs = new LinkedHashMap<>();
        allTariffs.stream()
                .sorted(Comparator.comparing(GasTariff::getVigenciaDesde).reversed())
                .forEach(t -> latestTariffs.putIfAbsent(t.getTarifa(), t));

        return analyzeSupplyPoint(sp, latestTariffs);
    }

    private TariffRecommendationDto analyzeSupplyPoint(SupplyPoint sp, Map<String, GasTariff> tariffs) {
        String cups = sp.getCups();
        List<GasReading> readings = gasReadingRepository.findByCupsOrderByFechaDesc(cups);

        if (readings.size() < 2) {
            log.debug("Not enough readings for CUPS {}", cups);
            return null;
        }

        // Sort readings chronologically
        readings.sort(Comparator.comparing(GasReading::getFecha));

        // Calculate monthly consumption periods
        List<MonthlyConsumption> monthlyConsumptions = calculateMonthlyConsumptions(readings, sp.getZona());

        if (monthlyConsumptions.isEmpty()) {
            return null;
        }

        // Simulate cost under each tariff
        Map<String, BigDecimal[]> tariffCosts = new LinkedHashMap<>(); // tarifa -> [totalFixed, totalVariable]

        for (Map.Entry<String, GasTariff> entry : tariffs.entrySet()) {
            GasTariff tariff = entry.getValue();
            BigDecimal totalFixed = BigDecimal.ZERO;
            BigDecimal totalVariable = BigDecimal.ZERO;

            for (MonthlyConsumption mc : monthlyConsumptions) {
                // Fixed cost for the month
                BigDecimal fixedCost = tariff.getFijoMesEur()
                        .setScale(2, RoundingMode.HALF_UP);
                totalFixed = totalFixed.add(fixedCost);

                // Variable cost: kWh * variableEurKwh
                BigDecimal variableCost = mc.kwh
                        .multiply(tariff.getVariableEurKwh())
                        .setScale(2, RoundingMode.HALF_UP);
                totalVariable = totalVariable.add(variableCost);
            }

            tariffCosts.put(entry.getKey(), new BigDecimal[]{totalFixed, totalVariable});
        }

        int periods = monthlyConsumptions.size();

        // Build comparison list and find best
        List<TariffComparisonDto> comparisons = new ArrayList<>();
        String bestTariff = null;
        BigDecimal bestAvgCost = null;

        for (Map.Entry<String, BigDecimal[]> entry : tariffCosts.entrySet()) {
            BigDecimal totalFixed = entry.getValue()[0];
            BigDecimal totalVariable = entry.getValue()[1];
            BigDecimal totalCost = totalFixed.add(totalVariable);
            BigDecimal avgMonthly = totalCost.divide(BigDecimal.valueOf(periods), 2, RoundingMode.HALF_UP);
            BigDecimal avgFixed = totalFixed.divide(BigDecimal.valueOf(periods), 2, RoundingMode.HALF_UP);
            BigDecimal avgVariable = totalVariable.divide(BigDecimal.valueOf(periods), 2, RoundingMode.HALF_UP);

            comparisons.add(new TariffComparisonDto(entry.getKey(), avgMonthly, avgFixed, avgVariable));

            if (bestAvgCost == null || avgMonthly.compareTo(bestAvgCost) < 0) {
                bestAvgCost = avgMonthly;
                bestTariff = entry.getKey();
            }
        }

        // Sort comparisons by cost ascending
        comparisons.sort(Comparator.comparing(TariffComparisonDto::avgMonthlyCostEur));

        // Current tariff cost
        BigDecimal[] currentCosts = tariffCosts.getOrDefault(sp.getTarifa(), new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
        BigDecimal currentTotal = currentCosts[0].add(currentCosts[1]);
        BigDecimal currentAvg = currentTotal.divide(BigDecimal.valueOf(periods), 2, RoundingMode.HALF_UP);

        BigDecimal monthlySavings = currentAvg.subtract(bestAvgCost).setScale(2, RoundingMode.HALF_UP);
        BigDecimal annualSavings = monthlySavings.multiply(BigDecimal.valueOf(12)).setScale(2, RoundingMode.HALF_UP);
        boolean isOptimal = sp.getTarifa().equals(bestTariff);

        return new TariffRecommendationDto(
                cups,
                sp.getZona(),
                sp.getTarifa(),
                bestTariff,
                currentAvg,
                bestAvgCost,
                monthlySavings,
                annualSavings,
                isOptimal,
                periods,
                comparisons
        );
    }

    private List<MonthlyConsumption> calculateMonthlyConsumptions(List<GasReading> sortedReadings, String zona) {
        List<MonthlyConsumption> result = new ArrayList<>();

        for (int i = 1; i < sortedReadings.size(); i++) {
            GasReading prev = sortedReadings.get(i - 1);
            GasReading curr = sortedReadings.get(i);

            BigDecimal m3 = curr.getLecturaM3().subtract(prev.getLecturaM3());
            if (m3.compareTo(BigDecimal.ZERO) <= 0) continue;

            // Derive the month from the current reading
            YearMonth ym = YearMonth.from(curr.getFecha());
            String mes = ym.format(DateTimeFormatter.ofPattern("yyyy-MM"));

            // Try to get conversion factor for this zona+month
            Optional<GasConversionFactor> factorOpt = gasConversionFactorRepository.findByZonaAndMes(zona, mes);

            BigDecimal kwh;
            if (factorOpt.isPresent()) {
                GasConversionFactor f = factorOpt.get();
                kwh = m3.multiply(f.getCoefConv()).multiply(f.getPcsKwhM3())
                        .setScale(3, RoundingMode.HALF_UP);
            } else {
                // Fallback: use a default conversion (approximate)
                kwh = m3.multiply(new BigDecimal("11.60"))
                        .setScale(3, RoundingMode.HALF_UP);
            }

            result.add(new MonthlyConsumption(mes, m3, kwh));
        }

        return result;
    }

    private record MonthlyConsumption(String month, BigDecimal m3, BigDecimal kwh) {}
}
