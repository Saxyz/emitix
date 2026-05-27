package com.unimag.emitix.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record InvoiceResponse(
        UUID id,
        String number,
        String prefix,
        String status,
        String invoiceType,
        String currency,
        BuyerResponse buyer,
        CompanyResponse company,
        BigDecimal subtotal,
        BigDecimal taxTotal,
        BigDecimal total,
        String paymentMethod,
        LocalDate dueDate,
        String cufe,
        String qrUrl,
        String pdfUrl,
        String xmlUrl,
        String notes,
        String createdBy,
        LocalDateTime issuedAt,
        List<InvoiceItemResponse> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
