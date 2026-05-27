package com.unimag.emitix.service;

import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.dto.ReportInvoiceRow;
import com.unimag.emitix.dto.ReportSummaryResponse;
import com.unimag.emitix.entity.Buyer;
import com.unimag.emitix.entity.Invoice;
import com.unimag.emitix.entity.enums.InvoiceStatus;
import com.unimag.emitix.entity.enums.InvoiceType;
import com.unimag.emitix.repository.InvoiceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock private InvoiceRepository invoiceRepository;

    @InjectMocks private ReportService reportService;

    // ── summary ───────────────────────────────────────────────────────────────

    @Test
    void summary_withData_returnsCorrectTotals() {
        LocalDateTime from = LocalDateTime.now().minusDays(30);
        LocalDateTime to   = LocalDateTime.now();

        when(invoiceRepository.countByStatus(InvoiceStatus.ACCEPTED)).thenReturn(8L);
        when(invoiceRepository.countByStatus(InvoiceStatus.REJECTED)).thenReturn(1L);
        when(invoiceRepository.countByStatus(InvoiceStatus.DRAFT)).thenReturn(3L);
        when(invoiceRepository.countByStatus(InvoiceStatus.ISSUED)).thenReturn(0L);
        when(invoiceRepository.countByStatus(InvoiceStatus.SENT)).thenReturn(0L);
        when(invoiceRepository.countByStatus(InvoiceStatus.CANCELLED)).thenReturn(0L);
        when(invoiceRepository.sumTotalBetween(from, to)).thenReturn(new BigDecimal("5000000.00"));
        when(invoiceRepository.sumTaxBetween(from, to)).thenReturn(new BigDecimal("950000.00"));

        ReportSummaryResponse result = reportService.summary(from, to);

        assertEquals(12L, result.totalInvoices());
        assertEquals(8L,  result.acceptedInvoices());
        assertEquals(1L,  result.rejectedInvoices());
        assertEquals(3L,  result.draftInvoices());
        assertEquals(new BigDecimal("5000000.00"), result.totalAmount());
        assertEquals(new BigDecimal("950000.00"),  result.totalTax());
        assertEquals(66.67, result.acceptanceRate());
    }

    @Test
    void summary_withNoInvoices_returnsZeroAcceptanceRate() {
        LocalDateTime from = LocalDateTime.now().minusDays(30);
        LocalDateTime to   = LocalDateTime.now();

        when(invoiceRepository.countByStatus(any(InvoiceStatus.class))).thenReturn(0L);
        when(invoiceRepository.sumTotalBetween(from, to)).thenReturn(BigDecimal.ZERO);
        when(invoiceRepository.sumTaxBetween(from, to)).thenReturn(BigDecimal.ZERO);

        ReportSummaryResponse result = reportService.summary(from, to);

        assertEquals(0L,   result.totalInvoices());
        assertEquals(0.0,  result.acceptanceRate());
    }

    // ── invoices ──────────────────────────────────────────────────────────────

    @Test
    void invoices_withFilters_returnsMappedPage() {
        LocalDateTime from = LocalDateTime.now().minusDays(7);
        LocalDateTime to   = LocalDateTime.now();
        Pageable pageable  = PageRequest.of(0, 10);

        Buyer buyer = Buyer.builder().fullName("Cliente Test").build();
        Invoice invoice = Invoice.builder()
                .prefix("FE")
                .number("0001")
                .status(InvoiceStatus.ACCEPTED)
                .invoiceType(InvoiceType.SALE)
                .subtotal(new BigDecimal("1000000.00"))
                .taxTotal(new BigDecimal("190000.00"))
                .total(new BigDecimal("1190000.00"))
                .buyer(buyer)
                .build();
        invoice.setId(UUID.randomUUID());

        when(invoiceRepository.findByReportFilters(
                eq(from), eq(to), eq(InvoiceStatus.ACCEPTED), eq(InvoiceType.SALE), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(invoice)));

        PageResponse<ReportInvoiceRow> result =
                reportService.invoices(from, to, "ACCEPTED", "SALE", pageable);

        assertEquals(1, result.content().size());
        ReportInvoiceRow row = result.content().get(0);
        assertEquals("FE-0001",  row.number());
        assertEquals("ACCEPTED", row.status());
        assertEquals("Cliente Test", row.buyerName());
    }

    @Test
    void invoices_withNullFilters_passesNullEnums() {
        Pageable pageable = PageRequest.of(0, 10);
        when(invoiceRepository.findByReportFilters(any(), any(), isNull(), isNull(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        PageResponse<ReportInvoiceRow> result = reportService.invoices(null, null, null, null, pageable);

        assertEquals(0, result.content().size());
    }
}
