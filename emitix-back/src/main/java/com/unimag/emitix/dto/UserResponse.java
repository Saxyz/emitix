package com.unimag.emitix.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        UUID companyId,
        String username,
        String email,
        String fullName,
        String phone,
        String role,
        boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
