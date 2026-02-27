package com.naturgy.gas.controller;

import com.naturgy.gas.dto.BillingResultDto;
import com.naturgy.gas.service.BillingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gas/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/run")
    public BillingResultDto run(@RequestParam String period) {
        return billingService.runBilling(period);
    }
}
