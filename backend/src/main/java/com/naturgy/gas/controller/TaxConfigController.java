package com.naturgy.gas.controller;

import com.naturgy.gas.dto.TaxConfigDto;
import com.naturgy.gas.entity.TaxConfig;
import com.naturgy.gas.exception.NotFoundException;
import com.naturgy.gas.repository.TaxConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gas/taxes")
@RequiredArgsConstructor
public class TaxConfigController {

    private final TaxConfigRepository repo;

    @GetMapping
    public List<TaxConfigDto> list() {
        return repo.findAll().stream().map(TaxConfigDto::from).toList();
    }

    @GetMapping("/{taxCode}")
    public TaxConfigDto get(@PathVariable String taxCode) {
        return repo.findById(taxCode)
                .map(TaxConfigDto::from)
                .orElseThrow(() -> new NotFoundException("Tax not found: " + taxCode));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaxConfigDto create(@RequestBody TaxConfigDto dto) {
        if (repo.existsById(dto.taxCode())) {
            throw new IllegalStateException("Tax already exists: " + dto.taxCode());
        }
        return TaxConfigDto.from(repo.save(dto.toEntity()));
    }

    @PutMapping("/{taxCode}")
    public TaxConfigDto update(@PathVariable String taxCode, @RequestBody TaxConfigDto dto) {
        TaxConfig tc = repo.findById(taxCode)
                .orElseThrow(() -> new NotFoundException("Tax not found: " + taxCode));
        tc.setTaxRate(dto.taxRate());
        tc.setVigenciaDesde(dto.vigenciaDesde());
        return TaxConfigDto.from(repo.save(tc));
    }

    @DeleteMapping("/{taxCode}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String taxCode) {
        if (!repo.existsById(taxCode)) {
            throw new NotFoundException("Tax not found: " + taxCode);
        }
        repo.deleteById(taxCode);
    }
}
