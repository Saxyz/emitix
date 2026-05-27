package com.unimag.emitix.dto;

import java.util.UUID;

public record LoginResponse(
        String token,
        String username,
        String fullName,
        String role,
        UUID companyId
) {}
