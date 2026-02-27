package com.naturgy.gas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "gas_tariffs")
@Getter
@Setter
@NoArgsConstructor
public class GasTariff {

    @Id
    @Column(nullable = false, length = 20)
    private String tarifa;

    @Column(name = "fijo_mes_eur", nullable = false, precision = 10, scale = 4)
    private BigDecimal fijoMesEur;

    @Column(name = "variable_eur_kwh", nullable = false, precision = 10, scale = 6)
    private BigDecimal variableEurKwh;

    @Column(name = "vigencia_desde", nullable = false)
    private LocalDate vigenciaDesde;
}
