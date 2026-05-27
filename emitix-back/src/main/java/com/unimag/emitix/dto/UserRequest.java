package com.unimag.emitix.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserRequest(
        @NotBlank(message = "El username es requerido")
        @Size(min = 3, max = 50)
        String username,

        @NotBlank(message = "La contraseña es requerida")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        String password,

        @NotBlank(message = "El email es requerido")
        @Email(message = "Email inválido")
        String email,

        @NotBlank(message = "El nombre completo es requerido")
        @Size(max = 150)
        String fullName,

        @Size(max = 20)
        String phone,

        @NotBlank(message = "El rol es requerido")
        @Pattern(regexp = "ADMIN|ACCOUNTANT|VIEWER", message = "Rol inválido. Use: ADMIN, ACCOUNTANT o VIEWER")
        String role
) {}
