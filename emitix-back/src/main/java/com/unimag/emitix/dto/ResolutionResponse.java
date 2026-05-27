package com.unimag.emitix.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ResolutionResponse(
        UUID id,
        UUID companyId,
        String prefix,
        String resolutionNumber,
        LocalDate resolutionDate,
        long rangeFrom,
        long rangeTo,
        long currentNumber,
        LocalDate validFrom,
        LocalDate validUntil,
        boolean isActive,
        LocalDateTime createdAt
) {}
