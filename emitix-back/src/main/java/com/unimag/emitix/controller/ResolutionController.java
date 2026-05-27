package com.unimag.emitix.controller;

import com.unimag.emitix.dto.ResolutionRequest;
import com.unimag.emitix.dto.ResolutionResponse;
import com.unimag.emitix.service.ResolutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/company/resolutions")
@RequiredArgsConstructor
public class ResolutionController {

    private final ResolutionService resolutionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','ACCOUNTANT','VIEWER')")
    public ResponseEntity<List<ResolutionResponse>> getResolutions(
            @RequestParam UUID companyId) {
        return ResponseEntity.ok(resolutionService.findByCompany(companyId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ResolutionResponse> createResolution(
            @Valid @RequestBody ResolutionRequest request,
            @RequestParam UUID companyId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resolutionService.create(request, companyId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<ResolutionResponse> updateResolution(
            @PathVariable UUID id,
            @Valid @RequestBody ResolutionRequest request) {
        return ResponseEntity.ok(resolutionService.update(id, request));
    }
}
