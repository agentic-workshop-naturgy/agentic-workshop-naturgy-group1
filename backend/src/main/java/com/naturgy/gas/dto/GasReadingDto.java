package com.naturgy.gas.dto;

import com.naturgy.gas.entity.GasReading;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GasReadingDto(
        Long id,
        String cups,
        LocalDate fecha,
        BigDecimal lecturaM3,
        String tipo
) {
    public static GasReadingDto from(GasReading e) {
        return new GasReadingDto(e.getId(), e.getCups(), e.getFecha(), e.getLecturaM3(), e.getTipo().name());
    }

    public GasReading toEntity() {
        GasReading gr = new GasReading();
        gr.setCups(cups);
        gr.setFecha(fecha);
        gr.setLecturaM3(lecturaM3);
        gr.setTipo(GasReading.TipoLectura.valueOf(tipo));
        return gr;
    }
}
