package com.unimag.emitix.service;

import com.unimag.emitix.dto.InvoiceResponse;
import com.unimag.emitix.entity.Invoice;
import com.unimag.emitix.entity.InvoiceItem;
import com.unimag.emitix.entity.enums.InvoiceStatus;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.exception.InvalidInvoiceStateException;
import com.unimag.emitix.mapper.InvoiceMapper;
import com.unimag.emitix.repository.InvoiceRepository;
import com.unimag.emitix.service.gateway.DianGateway;
import com.unimag.emitix.service.gateway.DianResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceProcessingServiceTest {

    @Mock
    private InvoiceService invoiceService;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private TaxCalculationService taxCalculationService;

    @Mock
    private InvoiceNumberService invoiceNumberService;

    @Mock
    private InvoiceXmlService invoiceXmlService;

    @Mock
    private DianGateway dianGateway;

    @Mock
    private InvoiceMapper invoiceMapper;

    @InjectMocks
    private InvoiceProcessingService invoiceProcessingService;

    @Test
    void confirmInvoice_Successful() {
        // Arrange
        UUID invoiceId = UUID.randomUUID();
        Invoice invoice = new Invoice();
        invoice.setId(invoiceId);
        invoice.setStatus(InvoiceStatus.DRAFT);
        
        InvoiceItem item = new InvoiceItem();
        invoice.addItem(item);

        when(invoiceService.getInvoiceOrThrow(invoiceId)).thenReturn(invoice);
        when(invoiceNumberService.generateNextNumber()).thenReturn("FE-0001");
        when(invoiceXmlService.generateXml(invoice)).thenReturn("<xml>test</xml>");
        
        DianResponse dianResponse = new DianResponse(true, "track-123", "Approved", LocalDateTime.now());
        when(dianGateway.sendInvoice("<xml>test</xml>", "FE-0001")).thenReturn(dianResponse);
        
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));
        InvoiceResponse response = mock(InvoiceResponse.class);
        when(invoiceMapper.toResponse(any(Invoice.class))).thenReturn(response);

        // Act
        InvoiceResponse result = invoiceProcessingService.confirmInvoice(invoiceId);

        // Assert
        assertNotNull(result);
        assertEquals(InvoiceStatus.ACCEPTED, invoice.getStatus());
        assertEquals("FE", invoice.getPrefix());
        assertEquals("0001", invoice.getNumber());
        assertEquals("/api/invoices/" + invoiceId + "/xml", invoice.getXmlUrl());
        assertEquals("/api/invoices/" + invoiceId + "/pdf", invoice.getPdfUrl());

        verify(invoiceService).getInvoiceOrThrow(invoiceId);
        verify(taxCalculationService).calculateInvoiceTotals(invoice);
        verify(invoiceNumberService).generateNextNumber();
        verify(invoiceXmlService).generateXml(invoice);
        verify(dianGateway).sendInvoice("<xml>test</xml>", "FE-0001");
        verify(invoiceRepository).save(invoice);
        verify(invoiceMapper).toResponse(invoice);
    }

    @Test
    void confirmInvoice_InvalidState() {
        // Arrange
        UUID invoiceId = UUID.randomUUID();
        Invoice invoice = new Invoice();
        invoice.setId(invoiceId);
        invoice.setStatus(InvoiceStatus.ACCEPTED);

        when(invoiceService.getInvoiceOrThrow(invoiceId)).thenReturn(invoice);

        // Act & Assert
        assertThrows(InvalidInvoiceStateException.class, () -> invoiceProcessingService.confirmInvoice(invoiceId));
        verify(invoiceService).getInvoiceOrThrow(invoiceId);
        verifyNoInteractions(taxCalculationService, invoiceNumberService, invoiceXmlService, dianGateway, invoiceRepository, invoiceMapper);
    }

    @Test
    void confirmInvoice_NoItems() {
        // Arrange
        UUID invoiceId = UUID.randomUUID();
        Invoice invoice = new Invoice();
        invoice.setId(invoiceId);
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setItems(Collections.emptyList());

        when(invoiceService.getInvoiceOrThrow(invoiceId)).thenReturn(invoice);

        // Act & Assert
        assertThrows(BusinessException.class, () -> invoiceProcessingService.confirmInvoice(invoiceId));
        verify(invoiceService).getInvoiceOrThrow(invoiceId);
        verifyNoInteractions(taxCalculationService, invoiceNumberService, invoiceXmlService, dianGateway, invoiceRepository, invoiceMapper);
    }

    @Test
    void confirmInvoice_DianRejected() {
        // Arrange
        UUID invoiceId = UUID.randomUUID();
        Invoice invoice = new Invoice();
        invoice.setId(invoiceId);
        invoice.setStatus(InvoiceStatus.DRAFT);
        
        InvoiceItem item = new InvoiceItem();
        invoice.addItem(item);

        when(invoiceService.getInvoiceOrThrow(invoiceId)).thenReturn(invoice);
        when(invoiceNumberService.generateNextNumber()).thenReturn("FE-0001");
        when(invoiceXmlService.generateXml(invoice)).thenReturn("<xml>test</xml>");
        
        DianResponse dianResponse = new DianResponse(false, null, "Error DIAN", LocalDateTime.now());
        when(dianGateway.sendInvoice("<xml>test</xml>", "FE-0001")).thenReturn(dianResponse);

        // Act & Assert
        assertThrows(BusinessException.class, () -> invoiceProcessingService.confirmInvoice(invoiceId));
        verify(invoiceService).getInvoiceOrThrow(invoiceId);
        verify(taxCalculationService).calculateInvoiceTotals(invoice);
        verify(invoiceNumberService).generateNextNumber();
        verify(invoiceXmlService).generateXml(invoice);
        verify(dianGateway).sendInvoice("<xml>test</xml>", "FE-0001");
        verifyNoInteractions(invoiceRepository, invoiceMapper);
    }
}
