package com.naturgy.gas.controller;

import com.naturgy.gas.dto.ClienteDto;
import com.naturgy.gas.entity.Cliente;
import com.naturgy.gas.exception.NotFoundException;
import com.naturgy.gas.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gas/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteRepository repo;

    @GetMapping
    public List<ClienteDto> list() {
        return repo.findAll().stream().map(ClienteDto::from).toList();
    }

    @GetMapping("/{id}")
    public ClienteDto get(@PathVariable Long id) {
        return repo.findById(id)
                .map(ClienteDto::from)
                .orElseThrow(() -> new NotFoundException("Cliente not found: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClienteDto create(@RequestBody ClienteDto dto) {
        if (repo.existsByNif(dto.nif())) {
            throw new IllegalStateException("Ya existe un cliente con NIF: " + dto.nif());
        }
        return ClienteDto.from(repo.save(dto.toEntity()));
    }

    @PutMapping("/{id}")
    public ClienteDto update(@PathVariable Long id, @RequestBody ClienteDto dto) {
        Cliente c = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("Cliente not found: " + id));
        c.setNif(dto.nif());
        c.setNombre(dto.nombre());
        c.setApellidos(dto.apellidos());
        c.setEmail(dto.email());
        c.setTelefono(dto.telefono());
        c.setFechaNacimiento(dto.fechaNacimiento());
        return ClienteDto.from(repo.save(c));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("Cliente not found: " + id);
        }
        repo.deleteById(id);
    }
}
