package com.naturgy.gas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices",
       uniqueConstraints = @UniqueConstraint(columnNames = {"cups", "periodo_inicio"}))
@Getter
@Setter
@NoArgsConstructor
public class Invoice {

    @Id
    @Column(name = "numero_factura", nullable = false, length = 60)
    private String numeroFactura;

    @Column(nullable = false, length = 50)
    private String cups;

    @Column(name = "periodo_inicio", nullable = false)
    private LocalDate periodoInicio;

    @Column(name = "periodo_fin", nullable = false)
    private LocalDate periodoFin;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal base;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal impuestos;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDate fechaEmision;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceLine> lines = new ArrayList<>();
}
