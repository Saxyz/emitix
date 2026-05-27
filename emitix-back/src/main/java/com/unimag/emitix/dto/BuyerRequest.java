package com.unimag.emitix.dto;

import jakarta.validation.constraints.*;

public record BuyerRequest(
        @NotBlank(message = "El número de documento es requerido")
        @Size(max = 20)
        String documentNumber,

        @NotBlank(message = "El tipo de documento es requerido")
        @Pattern(regexp = "NIT|CC|CE|PA|TI|RC", message = "Tipo de documento inválido. Use: NIT, CC, CE, PA, TI o RC")
        String documentType,

        @NotBlank(message = "El nombre completo o razón social es requerido")
        @Size(max = 255)
        String fullName,

        @NotBlank(message = "El tipo de organización es requerido")
        @Pattern(regexp = "JURIDICA|NATURAL", message = "organizationType debe ser JURIDICA o NATURAL")
        String organizationType,

        @Pattern(regexp = "RES|NRES", message = "fiscalRegime debe ser RES o NRES")
        String fiscalRegime,

        @Email(message = "Email inválido")
        String email,

        @Size(max = 30)
        String phone,

        @Size(max = 300)
        String address,

        @Size(max = 100)
        String city,

        @Size(max = 100)
        String department,

        @Size(max = 10)
        String postalCode,

        @Size(max = 2)
        String country,

        Boolean isActive
) {}
