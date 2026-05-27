package com.unimag.emitix.service;

import com.unimag.emitix.dto.CreateInvoiceRequest;
import com.unimag.emitix.dto.InvoiceItemRequest;
import com.unimag.emitix.dto.InvoiceResponse;
import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.entity.*;
import com.unimag.emitix.entity.enums.InvoiceStatus;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.mapper.InvoiceMapper;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.BuyerRepository;
import com.unimag.emitix.repository.InvoiceRepository;
import com.unimag.emitix.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private BuyerRepository buyerRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InvoiceMapper invoiceMapper;

    @InjectMocks
    private InvoiceService invoiceService;

    @Test
    void findAll_Successful() {
        // Arrange
        Invoice invoice = new Invoice();
        Page<Invoice> invoicePage = new PageImpl<>(List.of(invoice));
        Pageable pageable = PageRequest.of(0, 10);

        when(invoiceRepository.findByFilters(any(), any(), any(), eq(pageable))).thenReturn(invoicePage);
        InvoiceResponse response = mock(InvoiceResponse.class);
        when(invoiceMapper.toResponse(invoice)).thenReturn(response);

        // Act
        PageResponse<InvoiceResponse> result = invoiceService.findAll(InvoiceStatus.DRAFT, "Client", "FE-", pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.content().size());
        verify(invoiceRepository).findByFilters(any(), any(), any(), eq(pageable));
        verify(invoiceMapper).toResponse(invoice);
    }

    @Test
    void findById_Successful() {
        // Arrange
        UUID id = UUID.randomUUID();
        Invoice invoice = new Invoice();
        invoice.setId(id);

        when(invoiceRepository.findById(id)).thenReturn(Optional.of(invoice));
        InvoiceResponse response = mock(InvoiceResponse.class);
        when(invoiceMapper.toResponse(invoice)).thenReturn(response);

        // Act
        InvoiceResponse result = invoiceService.findById(id);

        // Assert
        assertNotNull(result);
        verify(invoiceRepository).findById(id);
        verify(invoiceMapper).toResponse(invoice);
    }

    @Test
    void findById_NotFound() {
        // Arrange
        UUID id = UUID.randomUUID();
        when(invoiceRepository.findById(id)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> invoiceService.findById(id));
        verify(invoiceRepository).findById(id);
        verifyNoInteractions(invoiceMapper);
    }

    @Test
    void create_Successful() {
        // Arrange
        UUID buyerId = UUID.randomUUID();
        InvoiceItemRequest itemReq = new InvoiceItemRequest("Item 1", BigDecimal.ONE, BigDecimal.TEN, new BigDecimal("19.00"), null, "UND", null, null, null);
        CreateInvoiceRequest request = new CreateInvoiceRequest(buyerId, null, null, null, "Some notes", List.of(itemReq));

        Buyer buyer = new Buyer();
        buyer.setId(buyerId);

        Company company = new Company();

        User user = new User();
        user.setUsername("admin");

        when(buyerRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
        when(companyRepository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(company));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice inv = invocation.getArgument(0);
            inv.setId(UUID.randomUUID());
            return inv;
        });

        InvoiceResponse response = mock(InvoiceResponse.class);
        when(invoiceMapper.toResponse(any(Invoice.class))).thenReturn(response);

        // Act
        InvoiceResponse result = invoiceService.create(request, "admin");

        // Assert
        assertNotNull(result);
        verify(buyerRepository).findById(buyerId);
        verify(companyRepository).findFirstByOrderByCreatedAtAsc();
        verify(userRepository).findByUsername("admin");
        verify(invoiceRepository).save(any(Invoice.class));
        verify(invoiceMapper).toResponse(any(Invoice.class));
    }

    @Test
    void create_CustomerNotFound() {
        // Arrange
        UUID buyerId = UUID.randomUUID();
        CreateInvoiceRequest request = new CreateInvoiceRequest(buyerId, null, null, null, "Notes", Collections.emptyList());

        when(buyerRepository.findById(buyerId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> invoiceService.create(request, "admin"));
        verify(buyerRepository).findById(buyerId);
        verifyNoInteractions(companyRepository, userRepository, invoiceRepository, invoiceMapper);
    }

    @Test
    void create_CompanyNotFound() {
        // Arrange
        UUID buyerId = UUID.randomUUID();
        CreateInvoiceRequest request = new CreateInvoiceRequest(buyerId, null, null, null, "Notes", Collections.emptyList());
        Buyer buyer = new Buyer();

        when(buyerRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
        when(companyRepository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> invoiceService.create(request, "admin"));
        verify(buyerRepository).findById(buyerId);
        verify(companyRepository).findFirstByOrderByCreatedAtAsc();
        verifyNoInteractions(userRepository, invoiceRepository, invoiceMapper);
    }
}
