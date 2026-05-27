package com.unimag.emitix.controller;

import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.dto.ReportInvoiceRow;
import com.unimag.emitix.dto.ReportSummaryResponse;
import com.unimag.emitix.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * Resumen de facturas en el rango de fechas indicado.
     * Ejemplo: GET /api/reports/summary?from=2024-01-01T00:00:00&to=2024-12-31T23:59:59
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    public ResponseEntity<ReportSummaryResponse> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(reportService.summary(from, to));
    }

    /**
     * Listado paginado de facturas para reportes, con filtros opcionales de estado y tipo.
     * Ejemplo: GET /api/reports/invoices?from=...&to=...&status=ACCEPTED&invoiceType=SALE&page=0&size=20
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    public ResponseEntity<PageResponse<ReportInvoiceRow>> getInvoicesReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String invoiceType,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(reportService.invoices(from, to, status, invoiceType, pageable));
    }
}
