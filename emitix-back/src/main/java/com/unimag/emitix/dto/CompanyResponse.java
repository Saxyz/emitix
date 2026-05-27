package com.unimag.emitix.dto;

import java.util.UUID;

public record CompanyResponse(
        UUID id,
        String documentNumber,
        String legalName,
        String address,
        String city,
        String department,
        String country,
        String phone,
        String email,
        String logoUrl
) {}
