package com.naturgy.gas.service;

import com.naturgy.gas.dto.BillingResultDto;
import com.naturgy.gas.dto.BillingResultDto.BillingErrorDto;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final SupplyPointRepository supplyPointRepository;
    private final GasReadingRepository gasReadingRepository;
    private final GasTariffRepository gasTariffRepository;
    private final GasConversionFactorRepository gasConversionFactorRepository;
    private final TaxConfigRepository taxConfigRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceLineRepository invoiceLineRepository;
    private final BillingErrorRepository billingErrorRepository;

    @Transactional
    public BillingResultDto runBilling(String period) {
        YearMonth ym;
        try {
            ym = YearMonth.parse(period);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid period format. Expected YYYY-MM, got: " + period);
        }

        LocalDate periodStart = ym.atDay(1);
        LocalDate periodEnd = ym.atEndOfMonth();
        String yyyyMM = ym.format(DateTimeFormatter.ofPattern("yyyyMM"));

        // Clear previous billing errors for this period
        billingErrorRepository.deleteByPeriod(period);

        List<SupplyPoint> activePoints = supplyPointRepository.findByEstado(SupplyPoint.EstadoSupply.ACTIVO);
        log.info("Billing run {}: {} active supply points", period, activePoints.size());

        int created = 0;
        int updated = 0;
        List<BillingErrorDto> errorDtos = new ArrayList<>();

        for (SupplyPoint sp : activePoints) {
            try {
                boolean isNew = processSupplyPoint(sp, period, periodStart, periodEnd, yyyyMM);
                if (isNew) created++;
                else updated++;
            } catch (BillingException e) {
                log.warn("Billing error for CUPS {}: {}", sp.getCups(), e.getMessage());
                billingErrorRepository.save(new BillingError(sp.getCups(), period, e.getMessage()));
                errorDtos.add(new BillingErrorDto(sp.getCups(), e.getMessage()));
            }
        }

        log.info("Billing run {} done: {} created, {} updated, {} errors", period, created, updated, errorDtos.size());
        return new BillingResultDto(period, created, updated, errorDtos);
    }

    /**
     * Processes one supply point for the given billing period.
     *
     * @return true if a new invoice was created, false if an existing one was updated.
     */
    private boolean processSupplyPoint(SupplyPoint sp, String period,
                                       LocalDate periodStart, LocalDate periodEnd, String yyyyMM) {

        String cups = sp.getCups();

        // 1) Boundary readings
        Optional<GasReading> inicioOpt = gasReadingRepository
                .findTopByCupsAndFechaBeforeOrderByFechaDesc(cups, periodStart);
        Optional<GasReading> finOpt = gasReadingRepository
                .findTopByCupsAndFechaLessThanEqualOrderByFechaDesc(cups, periodEnd);

        if (inicioOpt.isEmpty()) {
            throw new BillingException("Missing lectura_inicio for CUPS " + cups + " period " + period);
        }
        if (finOpt.isEmpty()) {
            throw new BillingException("Missing lectura_fin for CUPS " + cups + " period " + period);
        }

        BigDecimal lecturaInicio = inicioOpt.get().getLecturaM3();
        BigDecimal lecturaFin = finOpt.get().getLecturaM3();

        // 2) m3 consumption
        BigDecimal m3Consumidos = lecturaFin.subtract(lecturaInicio);
        if (m3Consumidos.compareTo(ZERO) < 0) {
            throw new BillingException("Negative consumption for CUPS " + cups +
                    ": lectura_fin=" + lecturaFin + " < lectura_inicio=" + lecturaInicio);
        }

        // 3) Tariff
        GasTariff tariff = gasTariffRepository.findEffective(sp.getTarifa(), periodEnd)
                .orElseThrow(() -> new BillingException(
                        "No tariff found for tarifa=" + sp.getTarifa() + " on " + periodEnd));

        // 4) Conversion factor
        YearMonth ym = YearMonth.of(periodEnd.getYear(), periodEnd.getMonth());
        String mes = ym.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        GasConversionFactor factor = gasConversionFactorRepository.findByZonaAndMes(sp.getZona(), mes)
                .orElseThrow(() -> new BillingException(
                        "No conversion factor for zona=" + sp.getZona() + " mes=" + mes));

        // 5) IVA
        TaxConfig iva = taxConfigRepository.findEffective("IVA", periodEnd)
                .orElseThrow(() -> new BillingException("No IVA tax config found for period " + period));

        // Calculations
        BigDecimal kwh = m3Consumidos
                .multiply(factor.getCoefConv())
                .multiply(factor.getPcsKwhM3())
                .setScale(3, RoundingMode.HALF_UP);

        int daysInPeriod = periodEnd.getDayOfMonth();
        int daysInMonth = daysInPeriod; // monthly billing: same value
        BigDecimal costeFijo = tariff.getFijoMesEur()
                .multiply(BigDecimal.valueOf(daysInPeriod))
                .divide(BigDecimal.valueOf(daysInMonth), 2, RoundingMode.HALF_UP);

        BigDecimal costeVariable = kwh
                .multiply(tariff.getVariableEurKwh())
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal alquilerEur = ZERO; // Workshop default: 0.00
        BigDecimal base = costeFijo.add(costeVariable).add(alquilerEur)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal impuestos = base.multiply(iva.getTaxRate())
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal total = base.add(impuestos)
                .setScale(2, RoundingMode.HALF_UP);

        // Idempotency: check if invoice already exists for (cups, periodo_inicio)
        Optional<Invoice> existingOpt = invoiceRepository.findByCupsAndPeriodoInicio(cups, periodStart);

        boolean isNew;
        Invoice invoice;
        if (existingOpt.isPresent()) {
            invoice = existingOpt.get();
            invoice.getLines().clear();
            isNew = false;
        } else {
            invoice = new Invoice();
            String prefix = "GAS-" + yyyyMM + "-";
            long seq = invoiceRepository.countByNumeroFacturaStartingWith(prefix) + 1;
            invoice.setNumeroFactura(prefix + cups + "-" + String.format("%03d", seq));
            invoice.setCups(cups);
            invoice.setPeriodoInicio(periodStart);
            invoice.setPeriodoFin(periodEnd);
            isNew = true;
        }

        invoice.setBase(base);
        invoice.setImpuestos(impuestos);
        invoice.setTotal(total);
        invoice.setFechaEmision(LocalDate.now());

        // Build lines
        InvoiceLine lineaFija = new InvoiceLine();
        lineaFija.setInvoice(invoice);
        lineaFija.setTipoLinea(InvoiceLine.TipoLinea.TERMINO_FIJO);
        lineaFija.setDescripcion("Término fijo");
        lineaFija.setCantidad(BigDecimal.ONE.setScale(3, RoundingMode.HALF_UP));
        lineaFija.setPrecioUnitario(costeFijo.setScale(6, RoundingMode.HALF_UP));
        lineaFija.setImporte(costeFijo);

        InvoiceLine lineaVariable = new InvoiceLine();
        lineaVariable.setInvoice(invoice);
        lineaVariable.setTipoLinea(InvoiceLine.TipoLinea.TERMINO_VARIABLE);
        lineaVariable.setDescripcion("Término variable");
        lineaVariable.setCantidad(kwh.setScale(3, RoundingMode.HALF_UP));
        lineaVariable.setPrecioUnitario(tariff.getVariableEurKwh().setScale(6, RoundingMode.HALF_UP));
        lineaVariable.setImporte(costeVariable);

        InvoiceLine lineaIva = new InvoiceLine();
        lineaIva.setInvoice(invoice);
        lineaIva.setTipoLinea(InvoiceLine.TipoLinea.IVA);
        lineaIva.setDescripcion("IVA");
        lineaIva.setCantidad(iva.getTaxRate().setScale(3, RoundingMode.HALF_UP));
        lineaIva.setPrecioUnitario(base.setScale(6, RoundingMode.HALF_UP));
        lineaIva.setImporte(impuestos);

        invoice.getLines().add(lineaFija);
        invoice.getLines().add(lineaVariable);
        invoice.getLines().add(lineaIva);

        invoiceRepository.save(invoice);

        log.info("Invoice {} for CUPS {} period {}: base={} IVA={} total={}",
                invoice.getNumeroFactura(), cups, period, base, impuestos, total);
        return isNew;
    }

    /**
     * Internal unchecked exception for per-CUPS billing errors.
     */
    public static class BillingException extends RuntimeException {
        public BillingException(String message) {
            super(message);
        }
    }
}
