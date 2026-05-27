package com.unimag.emitix.dto;

import jakarta.validation.constraints.*;

public record CompanyRequest(
        @NotBlank(message = "El número de documento es requerido")
        @Size(max = 20, message = "El número de documento no puede superar 20 caracteres")
        String documentNumber,

        @NotBlank(message = "El nombre legal de la empresa es requerido")
        @Size(max = 255, message = "El nombre no puede superar 255 caracteres")
        String legalName,

        @Size(max = 255)
        String address,

        @Size(max = 100)
        String city,

        @Size(max = 100)
        String department,

        @Size(max = 2)
        String country,

        @Size(max = 30)
        String phone,

        @Email(message = "Email corporativo inválido")
        String email,

        String logoUrl
) {}
