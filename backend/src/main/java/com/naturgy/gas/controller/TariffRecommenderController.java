package com.naturgy.gas.controller;

import com.naturgy.gas.dto.TariffRecommendationDto;
import com.naturgy.gas.service.TariffRecommenderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gas/tariff-recommendations")
@RequiredArgsConstructor
public class TariffRecommenderController {

    private final TariffRecommenderService tariffRecommenderService;

    @GetMapping
    public List<TariffRecommendationDto> getAll() {
        return tariffRecommenderService.getRecommendations();
    }

    @GetMapping("/{cups}")
    public TariffRecommendationDto getByCups(@PathVariable String cups) {
        return tariffRecommenderService.getRecommendation(cups);
    }
}
