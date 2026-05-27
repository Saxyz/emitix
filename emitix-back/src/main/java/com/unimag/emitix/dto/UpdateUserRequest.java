package com.unimag.emitix.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Email(message = "Email inválido")
        String email,

        @Size(max = 150)
        String fullName,

        @Size(max = 20)
        String phone,

        @Pattern(regexp = "ADMIN|ACCOUNTANT|VIEWER", message = "Rol inválido. Use: ADMIN, ACCOUNTANT o VIEWER")
        String role,

        Boolean isActive
) {}
