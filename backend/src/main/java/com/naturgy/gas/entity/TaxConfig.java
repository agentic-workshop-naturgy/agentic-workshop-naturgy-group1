package com.naturgy.gas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tax_configs")
@Getter
@Setter
@NoArgsConstructor
public class TaxConfig {

    @Id
    @Column(name = "tax_code", nullable = false, length = 20)
    private String taxCode;

    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal taxRate;

    @Column(name = "vigencia_desde", nullable = false)
    private LocalDate vigenciaDesde;
}
