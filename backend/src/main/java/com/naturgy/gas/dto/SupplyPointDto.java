package com.naturgy.gas.dto;

import com.naturgy.gas.entity.SupplyPoint;

public record SupplyPointDto(
        String cups,
        String zona,
        String tarifa,
        String estado,
        Long clienteId,
        String calle,
        String numero,
        String piso,
        String codigoPostal,
        String municipio,
        String provincia,
        String direccion
) {
    public static SupplyPointDto from(SupplyPoint e) {
        return new SupplyPointDto(
                e.getCups(),
                e.getZona(),
                e.getTarifa(),
                e.getEstado().name(),
                e.getCliente() != null ? e.getCliente().getId() : null,
                e.getCalle(),
                e.getNumero(),
                e.getPiso(),
                e.getCodigoPostal(),
                e.getMunicipio(),
                e.getProvincia(),
                e.getDireccion()
        );
    }

    public SupplyPoint toEntity() {
        SupplyPoint sp = new SupplyPoint();
        sp.setCups(cups);
        sp.setZona(zona);
        sp.setTarifa(tarifa);
        sp.setEstado(SupplyPoint.EstadoSupply.valueOf(estado));
        sp.setCalle(calle);
        sp.setNumero(numero);
        sp.setPiso(piso);
        sp.setCodigoPostal(codigoPostal);
        sp.setMunicipio(municipio);
        sp.setProvincia(provincia);
        sp.setDireccion(direccion);
        return sp;
    }
}
