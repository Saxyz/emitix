package com.unimag.emitix.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record InvoiceItemResponse(
        UUID id,
        int lineNumber,
        String description,
        String unspscCode,
        String unit,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal discountPct,
        String taxType,
        BigDecimal taxRate,
        BigDecimal taxTotal,
        BigDecimal subtotal
) {}
