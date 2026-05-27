package com.unimag.emitix.controller;

import com.unimag.emitix.dto.CsvImportResult;
import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.dto.ProductRequest;
import com.unimag.emitix.dto.ProductResponse;
import com.unimag.emitix.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    public ResponseEntity<PageResponse<ProductResponse>> getProducts(
            @RequestParam UUID companyId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean includeInactive,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productService.findAll(companyId, search, includeInactive, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT')")
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request,
            @RequestParam UUID companyId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productService.create(request, companyId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT')")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import-csv")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT')")
    public ResponseEntity<CsvImportResult> importCsv(
            @RequestParam UUID companyId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(productService.importFromCsv(file, companyId));
    }
}
