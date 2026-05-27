package com.unimag.emitix.service;

import com.unimag.emitix.dto.BuyerRequest;
import com.unimag.emitix.dto.BuyerResponse;
import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.entity.Buyer;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.enums.DocumentType;
import com.unimag.emitix.entity.enums.FiscalRegime;
import com.unimag.emitix.entity.enums.OrganizationType;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.mapper.BuyerMapper;
import com.unimag.emitix.repository.BuyerRepository;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BuyerServiceTest {

    @Mock private BuyerRepository buyerRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private BuyerMapper buyerMapper;
    @Mock private AuditLogService auditLogService;

    @InjectMocks private BuyerService buyerService;

    private Company company;
    private Buyer buyer;
    private UUID companyId;
    private UUID buyerId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        buyerId   = UUID.randomUUID();

        company = Company.builder().documentNumber("900123456-7").legalName("Demo S.A.S").build();
        company.setId(companyId);

        buyer = Buyer.builder()
                .documentNumber("1012345678")
                .documentType(DocumentType.CC)
                .fullName("Juan Pérez")
                .organizationType(OrganizationType.NATURAL)
                .fiscalRegime(FiscalRegime.NRES)
                .company(company)
                .isActive(true)
                .build();
        buyer.setId(buyerId);
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    void findAll_returnsPagedResults() {
        Pageable pageable = PageRequest.of(0, 10);
        BuyerResponse response = mock(BuyerResponse.class);
        when(buyerRepository.findByCompanyAndSearch(companyId, null, pageable))
                .thenReturn(new PageImpl<>(List.of(buyer)));
        when(buyerMapper.toResponse(buyer)).thenReturn(response);

        PageResponse<BuyerResponse> result = buyerService.findAll(companyId, null, false, pageable);

        assertEquals(1, result.content().size());
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    void findById_found_returnsResponse() {
        BuyerResponse response = mock(BuyerResponse.class);
        when(buyerRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
        when(buyerMapper.toResponse(buyer)).thenReturn(response);

        assertNotNull(buyerService.findById(buyerId));
    }

    @Test
    void findById_notFound_throwsResourceNotFoundException() {
        when(buyerRepository.findById(buyerId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> buyerService.findById(buyerId));
    }

    // ── verifyDocument ────────────────────────────────────────────────────────

    @Test
    void verifyDocument_found_returnsResponse() {
        BuyerResponse response = mock(BuyerResponse.class);
        when(buyerRepository.findByCompanyIdAndDocumentNumber(companyId, "1012345678"))
                .thenReturn(Optional.of(buyer));
        when(buyerMapper.toResponse(buyer)).thenReturn(response);

        assertNotNull(buyerService.verifyDocument(companyId, "1012345678"));
    }

    @Test
    void verifyDocument_notFound_throwsResourceNotFoundException() {
        when(buyerRepository.findByCompanyIdAndDocumentNumber(companyId, "9999999"))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> buyerService.verifyDocument(companyId, "9999999"));
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_successful() {
        BuyerRequest req = new BuyerRequest("1012345679", "CC", "María López",
                "NATURAL", "NRES", "maria@test.com", "300", "Calle 1", "Bogotá",
                null, null, "CO", null);
        BuyerResponse response = mock(BuyerResponse.class);

        when(buyerRepository.existsByCompanyIdAndDocumentNumber(companyId, "1012345679")).thenReturn(false);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(buyerRepository.save(any(Buyer.class))).thenAnswer(inv -> {
            Buyer b = inv.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });
        when(buyerMapper.toResponse(any(Buyer.class))).thenReturn(response);

        assertNotNull(buyerService.create(req, companyId));
        verify(buyerRepository).save(any(Buyer.class));
    }

    @Test
    void create_duplicateDocument_throwsBusinessException() {
        BuyerRequest req = new BuyerRequest("1012345678", "CC", "Otro",
                "NATURAL", null, null, null, null, null, null, null, null, null);

        when(buyerRepository.existsByCompanyIdAndDocumentNumber(companyId, "1012345678")).thenReturn(true);

        assertThrows(BusinessException.class, () -> buyerService.create(req, companyId));
        verify(buyerRepository, never()).save(any());
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_successful() {
        BuyerRequest req = new BuyerRequest("1012345678", "CC", "Juan Actualizado",
                "NATURAL", "RES", "nuevo@email.com", null, null, "Medellín",
                null, null, "CO", null);
        BuyerResponse response = mock(BuyerResponse.class);

        when(buyerRepository.findById(buyerId)).thenReturn(Optional.of(buyer));
        when(buyerRepository.save(any(Buyer.class))).thenReturn(buyer);
        when(buyerMapper.toResponse(any(Buyer.class))).thenReturn(response);

        assertNotNull(buyerService.update(buyerId, req));
        assertEquals("Juan Actualizado", buyer.getFullName());
        assertEquals(FiscalRegime.RES, buyer.getFiscalRegime());
    }
}
