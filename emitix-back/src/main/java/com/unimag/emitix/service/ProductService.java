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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> findAll(UUID companyId, String search, Pageable pageable) {
        String searchParam = (search != null && !search.isBlank()) ? "%" + search.toLowerCase() + "%" : null;
        return PageResponse.of(
                productRepository.findActiveByCompanyAndSearch(companyId, searchParam, pageable)
                        .map(this::toResponse)
        );
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(UUID id) {
        return toResponse(getProductOrThrow(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request, UUID companyId) {
        if (productRepository.existsByCompanyIdAndInternalCode(companyId, request.internalCode())) {
            throw new BusinessException(
                    "Ya existe un producto con el código '" + request.internalCode() + "' en esta empresa");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", "id", companyId));

        Product product = Product.builder()
                .company(company)
                .internalCode(request.internalCode())
                .description(request.description())
                .unspscCode(request.unspscCode())
                .unit(request.unit() != null ? request.unit() : "UND")
                .unitPrice(request.unitPrice())
                .currency(request.currency() != null ? request.currency() : "COP")
                .taxRate(request.taxRate())
                .isIvaExcluded(request.isIvaExcluded() != null && request.isIvaExcluded())
                .isService(request.isService() != null && request.isService())
                .isActive(true)
                .build();

        Product saved = productRepository.save(product);
        log.info("Product '{}' created in company '{}'", saved.getInternalCode(), companyId);
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse update(UUID id, ProductRequest request) {
        Product product = getProductOrThrow(id);

        product.setDescription(request.description());
        product.setUnspscCode(request.unspscCode());
        if (request.unit() != null) product.setUnit(request.unit());
        product.setUnitPrice(request.unitPrice());
        if (request.currency() != null) product.setCurrency(request.currency());
        product.setTaxRate(request.taxRate() != null ? request.taxRate() : BigDecimal.valueOf(19.00));
        if (request.isIvaExcluded() != null) product.setIvaExcluded(request.isIvaExcluded());
        if (request.isService() != null) product.setService(request.isService());

        Product saved = productRepository.save(product);
        log.info("Product '{}' updated", saved.getInternalCode());
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Product product = getProductOrThrow(id);
        // Soft delete — conserva historial en invoice_items
        product.setActive(false);
        productRepository.save(product);
        log.info("Product '{}' deactivated (soft delete)", product.getInternalCode());
    }

    private Product getProductOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", id));
    }

    private ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getId(),
                p.getCompany().getId(),
                p.getInternalCode(),
                p.getDescription(),
                p.getUnspscCode(),
                p.getUnit(),
                p.getUnitPrice(),
                p.getCurrency(),
                p.getTaxRate(),
                p.isIvaExcluded(),
                p.isService(),
                p.isActive(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
