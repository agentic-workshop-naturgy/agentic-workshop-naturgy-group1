package com.naturgy.gas.dto;

import com.naturgy.gas.entity.TaxConfig;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TaxConfigDto(
        String taxCode,
        BigDecimal taxRate,
        LocalDate vigenciaDesde
) {
    public static TaxConfigDto from(TaxConfig e) {
        return new TaxConfigDto(e.getTaxCode(), e.getTaxRate(), e.getVigenciaDesde());
    }

    public TaxConfig toEntity() {
        TaxConfig tc = new TaxConfig();
        tc.setTaxCode(taxCode);
        tc.setTaxRate(taxRate);
        tc.setVigenciaDesde(vigenciaDesde);
        return tc;
    }
}
