package com.unimag.emitix.controller;

import com.unimag.emitix.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Catálogos estáticos para poblar selects en el frontend.
 * Todos los endpoints son públicos (no requieren autenticación).
 */
@RestController
@RequestMapping("/api/catalogs")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/document-types")
    public ResponseEntity<List<Map<String, String>>> getDocumentTypes() {
        return ResponseEntity.ok(catalogService.documentTypes());
    }

    @GetMapping("/organization-types")
    public ResponseEntity<List<Map<String, String>>> getOrganizationTypes() {
        return ResponseEntity.ok(catalogService.organizationTypes());
    }

    @GetMapping("/fiscal-regimes")
    public ResponseEntity<List<Map<String, String>>> getFiscalRegimes() {
        return ResponseEntity.ok(catalogService.fiscalRegimes());
    }

    @GetMapping("/payment-methods")
    public ResponseEntity<List<Map<String, String>>> getPaymentMethods() {
        return ResponseEntity.ok(catalogService.paymentMethods());
    }

    @GetMapping("/tax-types")
    public ResponseEntity<List<Map<String, String>>> getTaxTypes() {
        return ResponseEntity.ok(catalogService.taxTypes());
    }

    @GetMapping("/measurement-units")
    public ResponseEntity<List<Map<String, String>>> getMeasurementUnits() {
        return ResponseEntity.ok(catalogService.measurementUnits());
    }
}
