package com.naturgy.gas.controller;

import com.naturgy.gas.dto.GasConversionFactorDto;
import com.naturgy.gas.entity.GasConversionFactor;
import com.naturgy.gas.exception.NotFoundException;
import com.naturgy.gas.repository.GasConversionFactorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gas/conversion-factors")
@RequiredArgsConstructor
public class GasConversionFactorController {

    private final GasConversionFactorRepository repo;

    @GetMapping
    public List<GasConversionFactorDto> list() {
        return repo.findAll().stream().map(GasConversionFactorDto::from).toList();
    }

    @GetMapping("/{id}")
    public GasConversionFactorDto get(@PathVariable Long id) {
        return repo.findById(id)
                .map(GasConversionFactorDto::from)
                .orElseThrow(() -> new NotFoundException("GasConversionFactor not found: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GasConversionFactorDto create(@RequestBody GasConversionFactorDto dto) {
        if (repo.existsByZonaAndMes(dto.zona(), dto.mes())) {
            throw new IllegalStateException("Conversion factor already exists for zona=" + dto.zona() + " mes=" + dto.mes());
        }
        return GasConversionFactorDto.from(repo.save(dto.toEntity()));
    }

    @PutMapping("/{id}")
    public GasConversionFactorDto update(@PathVariable Long id, @RequestBody GasConversionFactorDto dto) {
        GasConversionFactor gcf = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("GasConversionFactor not found: " + id));
        gcf.setCoefConv(dto.coefConv());
        gcf.setPcsKwhM3(dto.pcsKwhM3());
        return GasConversionFactorDto.from(repo.save(gcf));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("GasConversionFactor not found: " + id);
        }
        repo.deleteById(id);
    }
}
