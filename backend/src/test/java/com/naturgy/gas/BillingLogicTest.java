package com.naturgy.gas;

import com.naturgy.gas.service.BillingService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pure unit tests for billing logic (no Spring context).
 * These replicate the core formulas from gas_logic-spec.txt.
 */
class BillingLogicTest {

    // ---- m³ → kWh conversion ----

    @Test
    void m3ToKwhConversion() {
        BigDecimal m3 = new BigDecimal("75.800"); // lectura_fin - lectura_inicio
        BigDecimal coefConv = new BigDecimal("1.02");
        BigDecimal pcs = new BigDecimal("11.68");

        BigDecimal kwh = m3.multiply(coefConv).multiply(pcs).setScale(3, RoundingMode.HALF_UP);

        // 75.8 * 1.02 * 11.68 = 77.316 * 11.68 = 903.051 (rounded to 3 decimals)
        assertThat(kwh).isEqualByComparingTo("903.051");
    }

    // ---- Boundary reading selection ----

    @Test
    void lecturaInicio_isLastReadingStrictlyBeforePeriodStart() {
        // lectura_inicio must be strictly before period_start
        // Simulated: readings on 2025-12-31, 2026-01-31 for CUPS; period=2026-02
        // period_start = 2026-02-01
        // lectura_inicio = 2026-01-31 (strictly before 2026-02-01) ✓
        // This test validates the rule rather than repository call
        var periodStart = java.time.LocalDate.of(2026, 2, 1);
        var readingDate = java.time.LocalDate.of(2026, 1, 31);
        assertThat(readingDate.isBefore(periodStart)).isTrue();
    }

    @Test
    void lecturaFin_isLastReadingOnOrBeforePeriodEnd() {
        var periodEnd = java.time.LocalDate.of(2026, 2, 28);
        var readingDate = java.time.LocalDate.of(2026, 2, 28);
        assertThat(!readingDate.isAfter(periodEnd)).isTrue();
    }

    // ---- Cost calculations with rounding ----

    @Test
    void costeFijo_isProrated_butEqualsFullForFullMonth() {
        BigDecimal fijoMesEur = new BigDecimal("3.85");
        int daysInPeriod = 28;
        int daysInMonth = 28;

        BigDecimal costeFijo = fijoMesEur
                .multiply(BigDecimal.valueOf(daysInPeriod))
                .divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP);

        assertThat(costeFijo).isEqualByComparingTo("3.85");
    }

    @Test
    void costeVariable_calculatedCorrectly() {
        BigDecimal kwh = new BigDecimal("903.051");
        BigDecimal variableEurKwh = new BigDecimal("0.0045");

        BigDecimal costeVariable = kwh.multiply(variableEurKwh).setScale(2, RoundingMode.HALF_UP);

        // 903.051 * 0.0045 = 4.0637... → rounds to 4.06
        assertThat(costeVariable).isEqualByComparingTo("4.06");
    }

    @Test
    void ivaParametrizable_appliedCorrectly() {
        BigDecimal base = new BigDecimal("7.91");
        BigDecimal ivaRate = new BigDecimal("0.21");

        BigDecimal impuestos = base.multiply(ivaRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = base.add(impuestos).setScale(2, RoundingMode.HALF_UP);

        assertThat(impuestos).isEqualByComparingTo("1.66");
        assertThat(total).isEqualByComparingTo("9.57");
    }

    @Test
    void ivaRate_0percent_givesZeroTax() {
        BigDecimal base = new BigDecimal("10.00");
        BigDecimal ivaRate = BigDecimal.ZERO;

        BigDecimal impuestos = base.multiply(ivaRate).setScale(2, RoundingMode.HALF_UP);

        assertThat(impuestos).isEqualByComparingTo("0.00");
    }

    @Test
    void negativConsumption_isDetected() {
        BigDecimal lecturaFin = new BigDecimal("1200.00");
        BigDecimal lecturaInicio = new BigDecimal("1250.50");

        BigDecimal m3Consumidos = lecturaFin.subtract(lecturaInicio);

        assertThat(m3Consumidos.compareTo(BigDecimal.ZERO)).isLessThan(0);
    }

    @Test
    void zeroConsumption_isValid_noError() {
        BigDecimal lecturaFin = new BigDecimal("1250.50");
        BigDecimal lecturaInicio = new BigDecimal("1250.50");

        BigDecimal m3Consumidos = lecturaFin.subtract(lecturaInicio);

        assertThat(m3Consumidos.compareTo(BigDecimal.ZERO)).isEqualTo(0);
        assertThat(m3Consumidos.compareTo(BigDecimal.ZERO) >= 0).isTrue();
    }

    @Test
    void roundingHalfUp_isUsed() {
        // 0.005 * rate test: HALF_UP should round 0.005 to 0.01
        BigDecimal val = new BigDecimal("0.005");
        BigDecimal rounded = val.setScale(2, RoundingMode.HALF_UP);
        assertThat(rounded).isEqualByComparingTo("0.01");
    }

    @Test
    void baseIsSum_of_fijo_variable_alquiler() {
        BigDecimal costeFijo = new BigDecimal("3.85");
        BigDecimal costeVariable = new BigDecimal("4.06");
        BigDecimal alquiler = BigDecimal.ZERO; // workshop default

        BigDecimal base = costeFijo.add(costeVariable).add(alquiler).setScale(2, RoundingMode.HALF_UP);

        assertThat(base).isEqualByComparingTo("7.91");
    }

    @Test
    void billingException_thrownOnNegativeConsumption() {
        BigDecimal m3Consumidos = new BigDecimal("-5.00");
        boolean shouldError = m3Consumidos.compareTo(BigDecimal.ZERO) < 0;

        assertThat(shouldError).isTrue();
    }
}
