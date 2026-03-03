package com.naturgy.gas.dto;

import com.naturgy.gas.entity.GasTariff;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GasTariffDto(
        String tarifa,
        BigDecimal fijoMesEur,
        BigDecimal variableEurKwh,
        LocalDate vigenciaDesde,
        String tipo
) {
    public static GasTariffDto from(GasTariff e) {
        return new GasTariffDto(
                e.getTarifa(),
                e.getFijoMesEur(),
                e.getVariableEurKwh(),
                e.getVigenciaDesde(),
                e.getTipo().name()
        );
    }

    public GasTariff toEntity() {
        GasTariff gt = new GasTariff();
        gt.setTarifa(tarifa);
        gt.setFijoMesEur(fijoMesEur);
        gt.setVariableEurKwh(variableEurKwh);
        gt.setVigenciaDesde(vigenciaDesde);
        gt.setTipo(tipo != null ? GasTariff.TipoTarifa.valueOf(tipo) : GasTariff.TipoTarifa.GAS);
        return gt;
    }
}
