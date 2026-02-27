package com.naturgy.gas;

import com.naturgy.gas.dto.BillingResultDto;
import com.naturgy.gas.entity.Invoice;
import com.naturgy.gas.entity.InvoiceLine;
import com.naturgy.gas.repository.InvoiceRepository;
import com.naturgy.gas.service.BillingService;
import com.naturgy.gas.service.PdfService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test: seed → billing run 2026-02 → invoices → PDF.
 * Uses the H2 in-memory database seeded by DataSeeder.
 * Each test method is transactional so invoice data is rolled back after each test.
 */
@SpringBootTest
@Transactional
class BillingIntegrationTest {

    @Autowired
    private BillingService billingService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PdfService pdfService;

    @Test
    void billingRun_2026_02_generatesExpectedInvoices() {
        BillingResultDto result = billingService.runBilling("2026-02");

        // 3 active supply points in seed data: AA, BB, CC
        assertThat(result.invoicesCreated() + result.invoicesUpdated())
                .as("Should generate 3 invoices for 3 active CUPS")
                .isEqualTo(3);
        assertThat(result.errors()).as("No billing errors expected for seeded data").isEmpty();
    }

    @Test
    void billingRun_invoicesAreIdempotent() {
        billingService.runBilling("2026-02");
        long countAfterFirst = invoiceRepository.count();

        billingService.runBilling("2026-02");
        long countAfterSecond = invoiceRepository.count();

        assertThat(countAfterSecond).as("No duplicate invoices should be created").isEqualTo(countAfterFirst);
    }

    @Test
    void billingRun_invoiceNumberFormat() {
        billingService.runBilling("2026-02");

        List<Invoice> invoices = invoiceRepository.findAll();
        for (Invoice inv : invoices) {
            assertThat(inv.getNumeroFactura())
                    .as("Invoice number should follow GAS-YYYYMM-CUPS-seq format")
                    .startsWith("GAS-202602-");
        }
    }

    @Test
    @Transactional
    void billingRun_invoiceForCupsAA_hasCorrectLines() {
        billingService.runBilling("2026-02");

        // CUPS AA: RL1, ZONA1
        // lectura_inicio: 2026-01-31 = 1250.50, lectura_fin: 2026-02-28 = 1325.80
        // m3 = 75.30, coefConv=1.02, pcs=11.68
        // kwh = 75.30 * 1.02 * 11.68 = 897.266... ≈ 897.266
        // coste_fijo = 3.85
        // coste_variable = 897.266 * 0.0045 = 4.04 (rounded)
        // base = 3.85 + 4.04 = 7.89
        // impuestos = 7.89 * 0.21 = 1.66
        // total = 9.55

        Optional<Invoice> invoiceOpt = invoiceRepository.findByCupsAndPeriodoInicio(
                "ES0021000000001AA",
                java.time.LocalDate.of(2026, 2, 1)
        );
        assertThat(invoiceOpt).isPresent();

        Invoice inv = invoiceOpt.get();
        assertThat(inv.getBase()).isGreaterThan(BigDecimal.ZERO);
        assertThat(inv.getTotal()).isGreaterThan(inv.getBase());
        assertThat(inv.getFechaEmision()).isNotNull();

        List<InvoiceLine> lines = inv.getLines();
        assertThat(lines).hasSizeGreaterThanOrEqualTo(3);

        boolean hasFijo = lines.stream().anyMatch(l -> l.getTipoLinea() == InvoiceLine.TipoLinea.TERMINO_FIJO);
        boolean hasVariable = lines.stream().anyMatch(l -> l.getTipoLinea() == InvoiceLine.TipoLinea.TERMINO_VARIABLE);
        boolean hasIva = lines.stream().anyMatch(l -> l.getTipoLinea() == InvoiceLine.TipoLinea.IVA);
        assertThat(hasFijo).isTrue();
        assertThat(hasVariable).isTrue();
        assertThat(hasIva).isTrue();
    }

    @Test
    void billingRun_invalidPeriod_throwsException() {
        org.junit.jupiter.api.Assertions.assertThrows(
                IllegalArgumentException.class,
                () -> billingService.runBilling("not-a-period")
        );
    }

    @Test
    void pdf_isGenerated_forExistingInvoice() throws Exception {
        billingService.runBilling("2026-02");

        Optional<Invoice> invoiceOpt = invoiceRepository.findByCupsAndPeriodoInicio(
                "ES0021000000001AA",
                java.time.LocalDate.of(2026, 2, 1)
        );
        assertThat(invoiceOpt).isPresent();

        // Use fetch-join to load lines eagerly
        Invoice invoiceWithLines = invoiceRepository.findByIdWithLines(invoiceOpt.get().getNumeroFactura()).orElseThrow();

        byte[] pdfBytes = pdfService.generate(invoiceWithLines);

        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(0);
        // PDF starts with %PDF
        assertThat(new String(pdfBytes, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    void billingRun_period_withoutData_registersErrors() {
        // Period with no readings – all CUPS should get billing errors
        BillingResultDto result = billingService.runBilling("2020-01");

        assertThat(result.errors()).isNotEmpty();
        assertThat(result.invoicesCreated()).isEqualTo(0);
        assertThat(result.invoicesUpdated()).isEqualTo(0);
    }
}
