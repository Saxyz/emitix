package com.unimag.emitix.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ReportInvoiceRow(
        UUID id,
        String number,
        String status,
        String invoiceType,
        String buyerName,
        BigDecimal subtotal,
        BigDecimal taxTotal,
        BigDecimal total,
        LocalDateTime issuedAt
) {}
