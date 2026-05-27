package com.unimag.emitix.dto;

import java.math.BigDecimal;

public record ReportSummaryResponse(
        long totalInvoices,
        long acceptedInvoices,
        long rejectedInvoices,
        long draftInvoices,
        long cancelledInvoices,
        BigDecimal totalAmount,
        BigDecimal totalTax,
        double acceptanceRate
) {}
