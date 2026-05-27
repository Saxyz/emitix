package com.unimag.emitix.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        UUID companyId,
        String internalCode,
        String description,
        String unspscCode,
        String unit,
        BigDecimal unitPrice,
        String currency,
        BigDecimal taxRate,
        boolean isIvaExcluded,
        boolean isService,
        boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
