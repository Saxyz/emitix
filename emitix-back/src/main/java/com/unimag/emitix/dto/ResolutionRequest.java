package com.unimag.emitix.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ResolutionRequest(
        @NotBlank(message = "El prefijo es requerido")
        @Size(max = 10)
        String prefix,

        // Número oficial de la resolución emitida por DIAN
        @Size(max = 50)
        String resolutionNumber,

        // Fecha en que DIAN emitió la resolución
        LocalDate resolutionDate,

        @NotNull(message = "El número inicial del rango es requerido")
        @Min(value = 1, message = "El número inicial debe ser mayor a 0")
        Long rangeFrom,

        @NotNull(message = "El número final del rango es requerido")
        @Min(value = 1, message = "El número final debe ser mayor a 0")
        Long rangeTo,

        @NotNull(message = "La fecha de inicio de vigencia es requerida")
        LocalDate validFrom,

        @NotNull(message = "La fecha de fin de vigencia es requerida")
        LocalDate validUntil
) {}
