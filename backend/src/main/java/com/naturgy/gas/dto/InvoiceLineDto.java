package com.naturgy.gas.dto;

import com.naturgy.gas.entity.InvoiceLine;

import java.math.BigDecimal;

public record InvoiceLineDto(
        Long id,
        String tipoLinea,
        String descripcion,
        BigDecimal cantidad,
        BigDecimal precioUnitario,
        BigDecimal importe
) {
    public static InvoiceLineDto from(InvoiceLine e) {
        return new InvoiceLineDto(
                e.getId(),
                e.getTipoLinea().name(),
                e.getDescripcion(),
                e.getCantidad(),
                e.getPrecioUnitario(),
                e.getImporte()
        );
    }
}
