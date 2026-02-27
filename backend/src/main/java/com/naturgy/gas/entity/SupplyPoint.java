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

    public enum EstadoSupply {
        ACTIVO, INACTIVO
    }
}
