package com.naturgy.gas.controller;

import com.naturgy.gas.dto.GasTariffDto;
import com.naturgy.gas.entity.GasTariff;
import com.naturgy.gas.exception.NotFoundException;
import com.naturgy.gas.repository.GasTariffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gas/tariffs")
@RequiredArgsConstructor
public class GasTariffController {

    private final GasTariffRepository repo;

    @GetMapping
    public List<GasTariffDto> list() {
        return repo.findAll().stream().map(GasTariffDto::from).toList();
    }

    @GetMapping("/{tarifa}")
    public GasTariffDto get(@PathVariable String tarifa) {
        return repo.findById(tarifa)
                .map(GasTariffDto::from)
                .orElseThrow(() -> new NotFoundException("GasTariff not found: " + tarifa));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GasTariffDto create(@RequestBody GasTariffDto dto) {
        if (repo.existsById(dto.tarifa())) {
            throw new IllegalStateException("GasTariff already exists: " + dto.tarifa());
        }
        return GasTariffDto.from(repo.save(dto.toEntity()));
    }

    @PutMapping("/{tarifa}")
    public GasTariffDto update(@PathVariable String tarifa, @RequestBody GasTariffDto dto) {
        GasTariff gt = repo.findById(tarifa)
                .orElseThrow(() -> new NotFoundException("GasTariff not found: " + tarifa));
        gt.setFijoMesEur(dto.fijoMesEur());
        gt.setVariableEurKwh(dto.variableEurKwh());
        gt.setVigenciaDesde(dto.vigenciaDesde());
        return GasTariffDto.from(repo.save(gt));
    }

    @DeleteMapping("/{tarifa}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String tarifa) {
        if (!repo.existsById(tarifa)) {
            throw new NotFoundException("GasTariff not found: " + tarifa);
        }
        repo.deleteById(tarifa);
    }
}
