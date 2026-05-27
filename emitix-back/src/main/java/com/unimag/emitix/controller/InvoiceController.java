package com.unimag.emitix.controller;

import com.unimag.emitix.dto.CreateInvoiceRequest;
import com.unimag.emitix.dto.InvoiceResponse;
import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.dto.UpdateInvoiceRequest;
import com.unimag.emitix.entity.Invoice;
import com.unimag.emitix.entity.enums.InvoiceStatus;
import com.unimag.emitix.service.InvoicePdfService;
import com.unimag.emitix.service.InvoiceProcessingService;
import com.unimag.emitix.service.InvoiceService;
import com.unimag.emitix.service.InvoiceXmlService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceProcessingService invoiceProcessingService;
    private final InvoicePdfService invoicePdfService;
    private final InvoiceXmlService invoiceXmlService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    public ResponseEntity<PageResponse<InvoiceResponse>> getInvoices(
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) String buyerName,
            @RequestParam(required = false) String invoiceNumber,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(invoiceService.findAll(status, buyerName, invoiceNumber, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT')")
    public ResponseEntity<InvoiceResponse> createInvoice(
            @Valid @RequestBody CreateInvoiceRequest request,
            Principal principal) {
        String createdBy = principal != null ? principal.getName() : "system";
        return ResponseEntity.ok(invoiceService.create(request, createdBy));
    }

    /**
     * Actualiza una factura en estado DRAFT.
     * Solo ADMIN y ACCOUNTANT pueden editar borradores.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT')")
    public ResponseEntity<InvoiceResponse> updateInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInvoiceRequest request) {
        return ResponseEntity.ok(invoiceService.update(id, request));
    }

    /**
     * Envía la factura a DIAN para su confirmación (DRAFT → ISSUED → SENT).
     */
    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT')")
    public ResponseEntity<InvoiceResponse> confirmInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceProcessingService.confirmInvoice(id));
    }

    /**
     * Cancela una factura ACCEPTED → CANCELLED.
     * Solo el ADMIN puede cancelar facturas ya aceptadas.
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<InvoiceResponse> cancelInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.cancel(id));
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable UUID id) {
        Invoice invoice = invoiceService.getInvoiceOrThrow(id);
        byte[] pdfBytes = invoicePdfService.generatePdf(invoice);

        String filename = "factura-" + invoice.getPrefix() + "-" + invoice.getNumber() + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    /**
     * Descarga el XML UBL 2.1 de la factura electrónica.
     */
    @GetMapping("/{id}/xml")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadInvoiceXml(@PathVariable UUID id) {
        Invoice invoice = invoiceService.getInvoiceOrThrow(id);
        String xml = invoiceXmlService.generateXml(invoice);

        String filename = "factura-" + invoice.getPrefix() + "-" + invoice.getNumber() + ".xml";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_XML)
                .body(xml.getBytes(StandardCharsets.UTF_8));
    }
}
