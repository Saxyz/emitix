package com.unimag.emitix.dto;

import java.util.UUID;

public record BuyerResponse(
        UUID id,
        UUID companyId,
        String documentNumber,
        String documentType,
        String fullName,
        String organizationType,
        String fiscalRegime,
        String email,
        String phone,
        String address,
        String city,
        String department,
        String postalCode,
        String country,
        boolean isActive
) {}
