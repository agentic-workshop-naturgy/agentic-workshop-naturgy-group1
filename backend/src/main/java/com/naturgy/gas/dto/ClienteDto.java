package com.naturgy.gas.dto;

import com.naturgy.gas.entity.Cliente;

import java.time.LocalDate;

public record ClienteDto(
        Long id,
        String nif,
        String nombre,
        String apellidos,
        String email,
        String telefono,
        LocalDate fechaNacimiento
) {
    public static ClienteDto from(Cliente e) {
        return new ClienteDto(
                e.getId(),
                e.getNif(),
                e.getNombre(),
                e.getApellidos(),
                e.getEmail(),
                e.getTelefono(),
                e.getFechaNacimiento()
        );
    }

    public Cliente toEntity() {
        Cliente c = new Cliente();
        c.setNif(nif);
        c.setNombre(nombre);
        c.setApellidos(apellidos);
        c.setEmail(email);
        c.setTelefono(telefono);
        c.setFechaNacimiento(fechaNacimiento);
        return c;
    }
}
