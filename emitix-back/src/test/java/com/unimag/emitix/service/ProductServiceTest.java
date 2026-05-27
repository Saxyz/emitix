package com.unimag.emitix.service;

import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.dto.ProductRequest;
import com.unimag.emitix.dto.ProductResponse;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.Product;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private CompanyRepository companyRepository;

    @InjectMocks private ProductService productService;

    private Company company;
    private Product product;
    private UUID companyId;
    private UUID productId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        productId = UUID.randomUUID();

        company = Company.builder().documentNumber("900123456-7").legalName("Demo S.A.S").build();
        company.setId(companyId);

        product = Product.builder()
                .company(company)
                .internalCode("SERV-001")
                .description("Servicio de prueba")
                .unit("HRA")
                .unitPrice(new BigDecimal("100000.00"))
                .currency("COP")
                .taxRate(new BigDecimal("19.00"))
                .isService(true)
                .isActive(true)
                .build();
        product.setId(productId);
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    void findAll_returnsPagedResults() {
        Pageable pageable = PageRequest.of(0, 10);
        when(productRepository.findActiveByCompanyAndSearch(companyId, null, pageable))
                .thenReturn(new PageImpl<>(List.of(product)));

        PageResponse<ProductResponse> result = productService.findAll(companyId, null, pageable);

        assertEquals(1, result.content().size());
        assertEquals("SERV-001", result.content().get(0).internalCode());
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    void findById_found_returnsResponse() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        ProductResponse result = productService.findById(productId);

        assertNotNull(result);
        assertEquals("SERV-001", result.internalCode());
    }

    @Test
    void findById_notFound_throwsResourceNotFoundException() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.findById(productId));
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_successful() {
        ProductRequest req = new ProductRequest("SERV-002", "Consultoría", "81112100",
                "HRA", new BigDecimal("200000"), "COP", new BigDecimal("19.00"),
                false, true);

        when(productRepository.existsByCompanyIdAndInternalCode(companyId, "SERV-002")).thenReturn(false);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> {
            Product p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        ProductResponse result = productService.create(req, companyId);

        assertNotNull(result);
        assertEquals("SERV-002", result.internalCode());
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void create_duplicateCode_throwsBusinessException() {
        ProductRequest req = new ProductRequest("SERV-001", "Desc", null,
                "UND", BigDecimal.TEN, "COP", new BigDecimal("19.00"), false, false);

        when(productRepository.existsByCompanyIdAndInternalCode(companyId, "SERV-001")).thenReturn(true);

        assertThrows(BusinessException.class, () -> productService.create(req, companyId));
        verify(productRepository, never()).save(any());
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_successful() {
        ProductRequest req = new ProductRequest("SERV-001", "Descripción nueva", null,
                "HRA", new BigDecimal("150000"), "COP", new BigDecimal("19.00"),
                false, true);

        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        ProductResponse result = productService.update(productId, req);

        assertNotNull(result);
        assertEquals("Descripción nueva", product.getDescription());
        assertEquals(new BigDecimal("150000"), product.getUnitPrice());
    }

    // ── delete (soft) ─────────────────────────────────────────────────────────

    @Test
    void delete_deactivatesProduct() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        productService.delete(productId);

        assertFalse(product.isActive());
        verify(productRepository).save(product);
    }

    @Test
    void delete_notFound_throwsResourceNotFoundException() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.delete(productId));
        verify(productRepository, never()).save(any());
    }
}
