package com.unimag.emitix.controller;

import com.unimag.emitix.dto.CompanyRequest;
import com.unimag.emitix.dto.CompanyResponse;
import com.unimag.emitix.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/company")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    public ResponseEntity<CompanyResponse> getCompany(Principal principal) {
        return ResponseEntity.ok(companyService.getCompanyForUser(principal.getName()));
    }

    @PutMapping
    public ResponseEntity<CompanyResponse> updateCompany(
            @Valid @RequestBody CompanyRequest request, Principal principal) {
        return ResponseEntity.ok(companyService.updateCompany(request, principal.getName()));
    }
}
