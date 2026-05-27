package com.unimag.emitix.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank(message = "El código interno es requerido")
        @Size(max = 100, message = "El código interno no puede superar 100 caracteres")
        String internalCode,

        @NotBlank(message = "La descripción del producto es requerida")
        @Size(max = 300)
        String description,

        // Código UNSPSC (8 dígitos)
        @Size(max = 8, message = "El código UNSPSC debe tener máximo 8 dígitos")
        String unspscCode,

        @Size(max = 10, message = "La unidad de medida no puede superar 10 caracteres")
        String unit,

        @NotNull(message = "El precio unitario es requerido")
        @DecimalMin(value = "0.0", inclusive = true, message = "El precio no puede ser negativo")
        BigDecimal unitPrice,

        @Size(max = 3)
        String currency,

        @NotNull(message = "La tasa de impuesto es requerida")
        @DecimalMin(value = "0.0", message = "La tasa de impuesto no puede ser negativa")
        @DecimalMax(value = "100.0", message = "La tasa de impuesto no puede superar 100%")
        BigDecimal taxRate,

        Boolean isIvaExcluded,

        Boolean isService,

        Boolean isActive
) {}
