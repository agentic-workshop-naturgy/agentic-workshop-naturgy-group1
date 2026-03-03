package com.naturgy.gas.dto;

import com.naturgy.gas.entity.SupplyPoint;

public record SupplyPointDto(
        String cups,
        String zona,
        String tarifa,
        String estado,
        boolean servigas
) {
    public static SupplyPointDto from(SupplyPoint e) {
        return new SupplyPointDto(e.getCups(), e.getZona(), e.getTarifa(), e.getEstado().name(), e.isServigas());
    }

    public SupplyPoint toEntity() {
        SupplyPoint sp = new SupplyPoint();
        sp.setCups(cups);
        sp.setZona(zona);
        sp.setTarifa(tarifa);
        sp.setEstado(SupplyPoint.EstadoSupply.valueOf(estado));
        sp.setServigas(servigas);
        return sp;
    }
}
