package com.naturgy.gas.controller;

import com.naturgy.gas.dto.InvoiceDto;
import com.naturgy.gas.entity.Invoice;
import com.naturgy.gas.exception.NotFoundException;
import com.naturgy.gas.repository.InvoiceRepository;
import com.naturgy.gas.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/gas/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceRepository repo;
    private final PdfService pdfService;

    @GetMapping
    public List<InvoiceDto> list(
            @RequestParam(required = false) String cups,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) String fechaEmision) {

        LocalDate periodoInicio = null;
        if (period != null && !period.isBlank()) {
            try {
                periodoInicio = YearMonth.parse(period).atDay(1);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid period format. Expected YYYY-MM, got: " + period);
            }
        }

        LocalDate fechaEmisionDate = null;
        if (fechaEmision != null && !fechaEmision.isBlank()) {
            try {
                fechaEmisionDate = LocalDate.parse(fechaEmision, DateTimeFormatter.ISO_LOCAL_DATE);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid fechaEmision format. Expected YYYY-MM-DD");
            }
        }

        return repo.findWithFilters(cups, periodoInicio, fechaEmisionDate)
                .stream()
                .map(InvoiceDto::fromHeader)
                .toList();
    }

    @GetMapping("/{invoiceId}")
    public InvoiceDto get(@PathVariable String invoiceId) {
        Invoice invoice = repo.findByIdWithLines(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found: " + invoiceId));
        return InvoiceDto.from(invoice);
    }

    @GetMapping(value = "/{invoiceId}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> pdf(@PathVariable String invoiceId) throws IOException {
        Invoice invoice = repo.findByIdWithLines(invoiceId)
                .orElseThrow(() -> new NotFoundException("Invoice not found: " + invoiceId));

        byte[] pdfBytes = pdfService.generate(invoice);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", invoiceId + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
