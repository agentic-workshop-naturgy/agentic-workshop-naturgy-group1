package com.naturgy.gas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "gas_conversion_factors",
       uniqueConstraints = @UniqueConstraint(columnNames = {"zona", "mes"}))
@Getter
@Setter
@NoArgsConstructor
public class GasConversionFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String zona;

    @Column(nullable = false, length = 7)
    private String mes;

    @Column(name = "coef_conv", nullable = false, precision = 10, scale = 6)
    private BigDecimal coefConv;

    @Column(name = "pcs_kwh_m3", nullable = false, precision = 10, scale = 6)
    private BigDecimal pcsKwhM3;
}
