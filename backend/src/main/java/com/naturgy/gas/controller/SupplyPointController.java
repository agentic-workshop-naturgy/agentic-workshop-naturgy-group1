package com.naturgy.gas.controller;

import com.naturgy.gas.dto.SupplyPointDto;
import com.naturgy.gas.entity.Cliente;
import com.naturgy.gas.entity.SupplyPoint;
import com.naturgy.gas.exception.NotFoundException;
import com.naturgy.gas.repository.ClienteRepository;
import com.naturgy.gas.repository.SupplyPointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gas/supply-points")
@RequiredArgsConstructor
public class SupplyPointController {

    private final SupplyPointRepository repo;
    private final ClienteRepository clienteRepository;

    @GetMapping
    public List<SupplyPointDto> list() {
        return repo.findAll().stream().map(SupplyPointDto::from).toList();
    }

    @GetMapping("/{cups}")
    public SupplyPointDto get(@PathVariable String cups) {
        return repo.findById(cups)
                .map(SupplyPointDto::from)
                .orElseThrow(() -> new NotFoundException("SupplyPoint not found: " + cups));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SupplyPointDto create(@RequestBody SupplyPointDto dto) {
        if (repo.existsById(dto.cups())) {
            throw new IllegalStateException("SupplyPoint already exists: " + dto.cups());
        }
        SupplyPoint sp = dto.toEntity();
        applyCliente(sp, dto.clienteId());
        return SupplyPointDto.from(repo.save(sp));
    }

    @PutMapping("/{cups}")
    public SupplyPointDto update(@PathVariable String cups, @RequestBody SupplyPointDto dto) {
        SupplyPoint sp = repo.findById(cups)
                .orElseThrow(() -> new NotFoundException("SupplyPoint not found: " + cups));
        sp.setZona(dto.zona());
        sp.setTarifa(dto.tarifa());
        sp.setEstado(SupplyPoint.EstadoSupply.valueOf(dto.estado()));
        sp.setCalle(dto.calle());
        sp.setNumero(dto.numero());
        sp.setPiso(dto.piso());
        sp.setCodigoPostal(dto.codigoPostal());
        sp.setMunicipio(dto.municipio());
        sp.setProvincia(dto.provincia());
        applyCliente(sp, dto.clienteId());
        return SupplyPointDto.from(repo.save(sp));
    }

    @DeleteMapping("/{cups}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String cups) {
        if (!repo.existsById(cups)) {
            throw new NotFoundException("SupplyPoint not found: " + cups);
        }
        repo.deleteById(cups);
    }

    private void applyCliente(SupplyPoint sp, Long clienteId) {
        if (clienteId == null) {
            sp.setCliente(null);
        } else {
            Cliente cliente = clienteRepository.findById(clienteId)
                    .orElseThrow(() -> new NotFoundException("Cliente not found: " + clienteId));
            sp.setCliente(cliente);
        }
    }
}
