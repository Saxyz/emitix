package com.unimag.emitix.controller;

import com.unimag.emitix.dto.BuyerRequest;
import com.unimag.emitix.dto.BuyerResponse;
import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.service.BuyerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/buyers")
@RequiredArgsConstructor
public class BuyerController {

    private final BuyerService buyerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    public ResponseEntity<PageResponse<BuyerResponse>> getBuyers(
            @RequestParam UUID companyId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(buyerService.findAll(companyId, search, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    public ResponseEntity<BuyerResponse> getBuyerById(@PathVariable UUID id) {
        return ResponseEntity.ok(buyerService.findById(id));
    }

    /**
     * Verifica si un número de documento existe en RUES / DIAN (implementación mock en MVP).
     * Devuelve los datos del comprador si ya está registrado, 404 si no existe.
     */
    @GetMapping("/verify-document")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT')")
    public ResponseEntity<BuyerResponse> verifyDocument(
            @RequestParam UUID companyId,
            @RequestParam String documentNumber) {
        return ResponseEntity.ok(buyerService.verifyDocument(companyId, documentNumber));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT')")
    public ResponseEntity<BuyerResponse> createBuyer(
            @Valid @RequestBody BuyerRequest request,
            @RequestParam UUID companyId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(buyerService.create(request, companyId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT')")
    public ResponseEntity<BuyerResponse> updateBuyer(
            @PathVariable UUID id,
            @Valid @RequestBody BuyerRequest request) {
        return ResponseEntity.ok(buyerService.update(id, request));
    }
}
