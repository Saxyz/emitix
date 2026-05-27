package com.unimag.emitix.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
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
        String fullName,

        String phone,

        @NotBlank(message = "El número de documento de la empresa es requerido")
        @Size(max = 20)
        String companyDocumentNumber,

        @NotBlank(message = "El nombre legal de la empresa es requerido")
        @Size(max = 255)
        String companyLegalName,

        @Size(max = 10)
        String organizationType,

        @Size(max = 10)
        String documentType
) {}
