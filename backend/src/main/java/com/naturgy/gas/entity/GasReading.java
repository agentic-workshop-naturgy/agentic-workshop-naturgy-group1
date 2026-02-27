package com.naturgy.gas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "gas_readings",
       uniqueConstraints = @UniqueConstraint(columnNames = {"cups", "fecha"}))
@Getter
@Setter
@NoArgsConstructor
public class GasReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String cups;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(name = "lectura_m3", nullable = false, precision = 12, scale = 3)
    private BigDecimal lecturaM3;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoLectura tipo;

    public enum TipoLectura {
        REAL, ESTIMADA
    }
}
