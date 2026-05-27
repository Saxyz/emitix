package com.unimag.emitix.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record InvoiceItemRequest(
        @NotBlank(message = "La descripción del ítem es requerida")
        String description,

        @NotNull(message = "La cantidad es requerida")
        @DecimalMin(value = "0.001", message = "La cantidad debe ser mayor a 0")
        BigDecimal quantity,

        @NotNull(message = "El precio unitario es requerido")
        @DecimalMin(value = "0.00", message = "El precio unitario no puede ser negativo")
        BigDecimal unitPrice,

        @DecimalMin(value = "0.00", message = "La tasa de impuesto no puede ser negativa")
        @DecimalMax(value = "100.0", message = "La tasa de impuesto no puede superar 100%")
        BigDecimal taxRate,

        UUID productId,

        @Size(max = 10)
        String unit,

        @DecimalMin(value = "0.00", message = "El descuento no puede ser negativo")
        @DecimalMax(value = "100.0", message = "El descuento no puede superar 100%")
        BigDecimal discountPct,

        @Size(max = 8)
        String unspscCode,

        @Size(max = 10)
        String taxType
) {}
