package com.naturgy.gas.controller;

import com.naturgy.gas.dto.GasReadingDto;
import com.naturgy.gas.entity.GasReading;
import com.naturgy.gas.exception.NotFoundException;
import com.naturgy.gas.repository.GasReadingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gas/readings")
@RequiredArgsConstructor
public class GasReadingController {

    private final GasReadingRepository repo;

    @GetMapping
    public List<GasReadingDto> list(@RequestParam(required = false) String cups) {
        List<GasReading> readings = cups != null
                ? repo.findByCupsOrderByFechaDesc(cups)
                : repo.findAll();
        return readings.stream().map(GasReadingDto::from).toList();
    }

    @GetMapping("/{id}")
    public GasReadingDto get(@PathVariable Long id) {
        return repo.findById(id)
                .map(GasReadingDto::from)
                .orElseThrow(() -> new NotFoundException("GasReading not found: " + id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GasReadingDto create(@RequestBody GasReadingDto dto) {
        if (repo.existsByCupsAndFecha(dto.cups(), dto.fecha())) {
            throw new IllegalStateException("Reading already exists for cups=" + dto.cups() + " fecha=" + dto.fecha());
        }
        return GasReadingDto.from(repo.save(dto.toEntity()));
    }

    @PutMapping("/{id}")
    public GasReadingDto update(@PathVariable Long id, @RequestBody GasReadingDto dto) {
        GasReading gr = repo.findById(id)
                .orElseThrow(() -> new NotFoundException("GasReading not found: " + id));
        gr.setLecturaM3(dto.lecturaM3());
        gr.setTipo(GasReading.TipoLectura.valueOf(dto.tipo()));
        return GasReadingDto.from(repo.save(gr));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            throw new NotFoundException("GasReading not found: " + id);
        }
        repo.deleteById(id);
    }
}
