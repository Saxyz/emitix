package com.unimag.emitix.service;

import com.unimag.emitix.dto.CsvImportResult;
import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.dto.ProductRequest;
import com.unimag.emitix.dto.ProductResponse;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.Product;
import com.unimag.emitix.entity.enums.EntityType;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CompanyRepository companyRepository;
    private final AuditLogService auditLogService;

    private String currentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "system";
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> findAll(UUID companyId, String search, boolean includeInactive, Pageable pageable) {
        String searchParam = (search != null && !search.isBlank()) ? "%" + search.toLowerCase() + "%" : null;
        var page = includeInactive
                ? productRepository.findByCompanyAndSearch(companyId, searchParam, pageable)
                : productRepository.findActiveByCompanyAndSearch(companyId, searchParam, pageable);
        return PageResponse.of(page.map(this::toResponse));
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
        auditLogService.record(currentUsername(), "CREAR", EntityType.PRODUCTO,
                saved.getId().toString(), saved.getInternalCode(),
                "Producto '" + saved.getDescription() + "' creado");
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
        if (request.isActive() != null) product.setActive(request.isActive());

        Product saved = productRepository.save(product);
        log.info("Product '{}' updated", saved.getInternalCode());
        auditLogService.record(currentUsername(), "ACTUALIZAR", EntityType.PRODUCTO,
                saved.getId().toString(), saved.getInternalCode(),
                "Producto '" + saved.getDescription() + "' actualizado");
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Product product = getProductOrThrow(id);
        try {
            productRepository.delete(product);
            productRepository.flush();
            log.info("Product '{}' deleted (hard delete)", product.getInternalCode());
            auditLogService.record(currentUsername(), "ELIMINAR", EntityType.PRODUCTO,
                    product.getId().toString(), product.getInternalCode(),
                    "Producto '" + product.getInternalCode() + "' eliminado");
        } catch (DataIntegrityViolationException e) {
            auditLogService.recordFailure(currentUsername(), "ELIMINAR", EntityType.PRODUCTO,
                    product.getId().toString(), product.getInternalCode(),
                    "No se pudo eliminar el producto '" + product.getInternalCode() + "'",
                    "Tiene facturas asociadas");
            throw new BusinessException("No se puede eliminar el producto '" + product.getInternalCode() +
                    "' porque está asociado a facturas existentes. Puedes desactivarlo desde Editar.");
        }
    }

    @Transactional
    public CsvImportResult importFromCsv(MultipartFile file, UUID companyId) {
        int imported = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            int row = 0;
            while ((line = reader.readLine()) != null) {
                row++;
                if (row == 1) continue; // skip header

                String[] cols = line.split(",", -1);
                if (cols.length < 5) {
                    errors.add("Fila " + row + ": columnas insuficientes (mínimo: internalCode,description,unit,unitPrice,taxRate)");
                    skipped++;
                    continue;
                }

                try {
                    String internalCode = cols[0].trim();
                    String description  = cols[1].trim();
                    String unspscCode   = cols.length > 2 ? cols[2].trim() : null;
                    String unit         = cols.length > 3 ? cols[3].trim() : "UND";
                    BigDecimal unitPrice = new BigDecimal(cols[4].trim());
                    BigDecimal taxRate   = cols.length > 5 && !cols[5].isBlank()
                            ? new BigDecimal(cols[5].trim()) : BigDecimal.valueOf(19);
                    boolean isService    = cols.length > 6 && "true".equalsIgnoreCase(cols[6].trim());

                    if (internalCode.isBlank() || description.isBlank()) {
                        errors.add("Fila " + row + ": código o descripción vacíos");
                        skipped++;
                        continue;
                    }

                    ProductRequest req = new ProductRequest(
                            internalCode,
                            description,
                            (unspscCode == null || unspscCode.isBlank()) ? null : unspscCode,
                            (unit == null || unit.isBlank()) ? "UND" : unit,
                            unitPrice,
                            "COP",
                            taxRate,
                            false,
                            isService,
                            null
                    );

                    if (productRepository.existsByCompanyIdAndInternalCode(companyId, internalCode)) {
                        // update existing
                        productRepository.findByCompanyIdAndInternalCode(companyId, internalCode)
                                .ifPresent(p -> {
                                    p.setDescription(req.description());
                                    p.setUnspscCode(req.unspscCode());
                                    p.setUnit(req.unit());
                                    p.setUnitPrice(req.unitPrice());
                                    p.setTaxRate(req.taxRate());
                                    p.setService(isService);
                                    productRepository.save(p);
                                });
                    } else {
                        create(req, companyId);
                    }
                    imported++;
                } catch (NumberFormatException e) {
                    errors.add("Fila " + row + ": precio o tasa con formato inválido");
                    skipped++;
                } catch (BusinessException e) {
                    errors.add("Fila " + row + ": " + e.getMessage());
                    skipped++;
                }
            }
        } catch (Exception e) {
            throw new BusinessException("Error al leer el archivo CSV: " + e.getMessage());
        }

        log.info("CSV import for company {}: {} imported, {} skipped, {} errors", companyId, imported, skipped, errors.size());
        auditLogService.record(currentUsername(), "IMPORTAR_CSV", EntityType.PRODUCTO,
                companyId.toString(), imported + " productos",
                "Importación CSV: " + imported + " importados, " + skipped + " omitidos, " + errors.size() + " errores");
        return new CsvImportResult(imported, skipped, errors);
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
