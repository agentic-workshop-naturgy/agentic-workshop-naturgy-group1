package com.naturgy.gas.dto;

import java.util.List;

public record BillingResultDto(
        String period,
        int invoicesCreated,
        int invoicesUpdated,
        List<BillingErrorDto> errors
) {
    public record BillingErrorDto(String cups, String error) {}
}
