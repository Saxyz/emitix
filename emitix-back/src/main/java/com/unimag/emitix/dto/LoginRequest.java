package com.unimag.emitix.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "El usuario es requerido")
        String username,

        @NotBlank(message = "La contraseña es requerida")
        String password
) {}
