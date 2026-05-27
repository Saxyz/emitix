package com.unimag.emitix.service;

import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.dto.ReportInvoiceRow;
import com.unimag.emitix.dto.ReportSummaryResponse;
import com.unimag.emitix.entity.Invoice;
import com.unimag.emitix.entity.enums.InvoiceStatus;
import com.unimag.emitix.entity.enums.InvoiceType;
import com.unimag.emitix.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public ReportSummaryResponse summary(LocalDateTime from, LocalDateTime to) {
        long total      = invoiceRepository.countByStatus(InvoiceStatus.ACCEPTED)
                        + invoiceRepository.countByStatus(InvoiceStatus.REJECTED)
                        + invoiceRepository.countByStatus(InvoiceStatus.DRAFT)
                        + invoiceRepository.countByStatus(InvoiceStatus.ISSUED)
                        + invoiceRepository.countByStatus(InvoiceStatus.SENT)
                        + invoiceRepository.countByStatus(InvoiceStatus.CANCELLED);
        long accepted   = invoiceRepository.countByStatus(InvoiceStatus.ACCEPTED);
        long rejected   = invoiceRepository.countByStatus(InvoiceStatus.REJECTED);
        long draft      = invoiceRepository.countByStatus(InvoiceStatus.DRAFT);
        long cancelled  = invoiceRepository.countByStatus(InvoiceStatus.CANCELLED);

        BigDecimal totalAmount = invoiceRepository.sumTotalBetween(from, to);
        BigDecimal totalTax    = invoiceRepository.sumTaxBetween(from, to);

        double acceptanceRate = total > 0
                ? BigDecimal.valueOf((double) accepted / total * 100)
                          .setScale(2, RoundingMode.HALF_UP)
                          .doubleValue()
                : 0.0;

        return new ReportSummaryResponse(
                total, accepted, rejected, draft, cancelled,
                totalAmount, totalTax, acceptanceRate
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<ReportInvoiceRow> invoices(
            LocalDateTime from, LocalDateTime to,
            String status, String invoiceType,
            Pageable pageable) {

        InvoiceStatus statusEnum = status != null ? InvoiceStatus.valueOf(status) : null;
        InvoiceType typeEnum     = invoiceType != null ? InvoiceType.valueOf(invoiceType) : null;

        Page<Invoice> page = invoiceRepository.findByReportFilters(from, to, statusEnum, typeEnum, pageable);

        return PageResponse.of(page.map(inv -> new ReportInvoiceRow(
                inv.getId(),
                inv.getPrefix() + "-" + inv.getNumber(),
                inv.getStatus().name(),
                inv.getInvoiceType().name(),
                inv.getBuyer().getFullName(),
                inv.getSubtotal(),
                inv.getTaxTotal(),
                inv.getTotal(),
                inv.getIssuedAt()
        )));
    }
}
