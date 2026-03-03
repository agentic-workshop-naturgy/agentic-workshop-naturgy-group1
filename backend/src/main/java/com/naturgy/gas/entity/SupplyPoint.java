package com.naturgy.gas.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "supply_points")
@Getter
@Setter
@NoArgsConstructor
public class SupplyPoint {

    @Id
    @Column(nullable = false, unique = true, length = 50)
    private String cups;

    @Column(nullable = false, length = 50)
    private String zona;

    @Column(nullable = false, length = 20)
    private String tarifa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EstadoSupply estado;

    // Relación con el titular del suministro
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    // Dirección del punto de suministro
    @Column(length = 200)
    private String calle;

    @Column(length = 20)
    private String numero;

    @Column(length = 30)
    private String piso;

    @Column(length = 10)
    private String codigoPostal;

    @Column(length = 100)
    private String municipio;

    @Column(length = 100)
    private String provincia;

    public enum EstadoSupply {
        ACTIVO, INACTIVO
    }
}
