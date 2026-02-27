package com.naturgy.gas.dto;

import com.naturgy.gas.entity.Invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record InvoiceDto(
        String numeroFactura,
        String cups,
        LocalDate periodoInicio,
        LocalDate periodoFin,
        BigDecimal base,
        BigDecimal impuestos,
        BigDecimal total,
        LocalDate fechaEmision,
        List<InvoiceLineDto> lines
) {
    public static InvoiceDto from(Invoice e) {
        List<InvoiceLineDto> linesDtos = e.getLines() == null ? List.of() :
                e.getLines().stream().map(InvoiceLineDto::from).toList();
        return new InvoiceDto(
                e.getNumeroFactura(),
                e.getCups(),
                e.getPeriodoInicio(),
                e.getPeriodoFin(),
                e.getBase(),
                e.getImpuestos(),
                e.getTotal(),
                e.getFechaEmision(),
                linesDtos
        );
    }

    public static InvoiceDto fromHeader(Invoice e) {
        return new InvoiceDto(
                e.getNumeroFactura(),
                e.getCups(),
                e.getPeriodoInicio(),
                e.getPeriodoFin(),
                e.getBase(),
                e.getImpuestos(),
                e.getTotal(),
                e.getFechaEmision(),
                List.of()
        );
    }
}
