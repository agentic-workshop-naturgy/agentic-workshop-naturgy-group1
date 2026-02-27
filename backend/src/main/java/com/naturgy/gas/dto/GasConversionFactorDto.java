package com.naturgy.gas.dto;

import com.naturgy.gas.entity.GasConversionFactor;

import java.math.BigDecimal;

public record GasConversionFactorDto(
        Long id,
        String zona,
        String mes,
        BigDecimal coefConv,
        BigDecimal pcsKwhM3
) {
    public static GasConversionFactorDto from(GasConversionFactor e) {
        return new GasConversionFactorDto(e.getId(), e.getZona(), e.getMes(), e.getCoefConv(), e.getPcsKwhM3());
    }

    public GasConversionFactor toEntity() {
        GasConversionFactor gcf = new GasConversionFactor();
        gcf.setZona(zona);
        gcf.setMes(mes);
        gcf.setCoefConv(coefConv);
        gcf.setPcsKwhM3(pcsKwhM3);
        return gcf;
    }
}
