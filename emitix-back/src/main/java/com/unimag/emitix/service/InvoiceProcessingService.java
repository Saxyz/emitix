package com.unimag.emitix.service;

import com.unimag.emitix.dto.InvoiceResponse;
import com.unimag.emitix.entity.Invoice;
import com.unimag.emitix.entity.enums.InvoiceStatus;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.exception.InvalidInvoiceStateException;
import com.unimag.emitix.mapper.InvoiceMapper;
import com.unimag.emitix.repository.InvoiceRepository;
import com.unimag.emitix.service.gateway.DianGateway;
import com.unimag.emitix.service.gateway.DianResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceProcessingService {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;
    private final TaxCalculationService taxCalculationService;
    private final InvoiceNumberService invoiceNumberService;
    private final InvoiceXmlService invoiceXmlService;
    private final DianGateway dianGateway;
    private final InvoiceMapper invoiceMapper;

    /**
     * Full invoice confirmation flow:
     * 1. Validate state and items
     * 2. Calculate taxes
     * 3. Assign consecutive number
     * 4. Generate XML
     * 5. Send to DIAN (mock)
     * 6. Update status
     */
    @Transactional
    public InvoiceResponse confirmInvoice(UUID invoiceId) {
        Invoice invoice = invoiceService.getInvoiceOrThrow(invoiceId);

        // Step 1: Validate state
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new InvalidInvoiceStateException(invoice.getStatus().name(), "confirmar");
        }

        // Step 2: Validate items exist
        if (invoice.getItems() == null || invoice.getItems().isEmpty()) {
            throw new BusinessException("La factura no tiene ítems. No se puede confirmar.");
        }

        // Step 3: Calculate taxes and totals
        log.info("Calculating taxes for invoice {}", invoice.getId());
        taxCalculationService.calculateInvoiceTotals(invoice);

        // Step 4: Assign real consecutive number
        String invoiceNumber = invoiceNumberService.generateNextNumber();
        String[] parts = invoiceNumber.split("-", 2);
        if (parts.length == 2) {
            invoice.setPrefix(parts[0]);
            invoice.setNumber(parts[1]);
        } else {
            invoice.setPrefix("FE");
            invoice.setNumber(invoiceNumber);
        }
        log.info("Assigned invoice number: {}", invoiceNumber);

        // Step 5: Generate XML
        log.info("Generating XML for invoice {}", invoiceNumber);
        String xml = invoiceXmlService.generateXml(invoice);
        invoice.setXmlUrl("/api/invoices/" + invoice.getId() + "/xml");
        invoice.setPdfUrl("/api/invoices/" + invoice.getId() + "/pdf");

        // Step 6: Send to DIAN (mock)
        log.info("Sending invoice {} to DIAN...", invoiceNumber);
        DianResponse dianResponse = dianGateway.sendInvoice(xml, invoiceNumber);

        if (!dianResponse.success()) {
            throw new BusinessException("La DIAN rechazó la factura: " + dianResponse.message());
        }

        // Step 7: Update status and save
        invoice.setStatus(InvoiceStatus.ACCEPTED);
        invoice.setIssuedAt(java.time.LocalDateTime.now());

        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice {} confirmed successfully. DIAN tracking: {}", invoiceNumber, dianResponse.trackingId());

        return invoiceMapper.toResponse(saved);
    }
}
