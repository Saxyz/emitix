package com.unimag.emitix.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "El email es requerido")
        @Email(message = "Email inválido")
        String email,

        @NotBlank(message = "El código OTP es requerido")
        String otp,

        @NotBlank(message = "La nueva contraseña es requerida")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        String newPassword
) {}
