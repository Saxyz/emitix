package com.unimag.emitix.service;

import com.unimag.emitix.dto.ResolutionRequest;
import com.unimag.emitix.dto.ResolutionResponse;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.Resolution;
import com.unimag.emitix.entity.enums.EntityType;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.ResolutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResolutionService {

    private final ResolutionRepository resolutionRepository;
    private final CompanyRepository companyRepository;
    private final AuditLogService auditLogService;

    private String currentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "system";
    }

    public List<ResolutionResponse> findByCompany(UUID companyId) {
        return resolutionRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ResolutionResponse create(ResolutionRequest request, UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa no encontrada: " + companyId));

        Resolution resolution = Resolution.builder()
                .company(company)
                .prefix(request.prefix())
                .resolutionNumber(request.resolutionNumber())
                .resolutionDate(request.resolutionDate())
                .rangeFrom(request.rangeFrom())
                .rangeTo(request.rangeTo())
                .validFrom(request.validFrom())
                .validUntil(request.validUntil())
                .isActive(true)
                .build();

        Resolution saved = resolutionRepository.save(resolution);
        log.info("Resolution '{}' created for company '{}'", saved.getPrefix(), companyId);
        auditLogService.record(currentUsername(), "CREAR", EntityType.RESOLUCION,
                saved.getId().toString(), saved.getPrefix() + " " + saved.getResolutionNumber(),
                "Resolución DIAN '" + saved.getPrefix() + "' creada");
        return toResponse(saved);
    }

    @Transactional
    public ResolutionResponse update(UUID id, ResolutionRequest request) {
        Resolution resolution = resolutionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resolución no encontrada: " + id));

        resolution.setPrefix(request.prefix());
        resolution.setResolutionNumber(request.resolutionNumber());
        resolution.setResolutionDate(request.resolutionDate());
        resolution.setRangeFrom(request.rangeFrom());
        resolution.setRangeTo(request.rangeTo());
        resolution.setValidFrom(request.validFrom());
        resolution.setValidUntil(request.validUntil());

        Resolution saved = resolutionRepository.save(resolution);
        log.info("Resolution '{}' updated", saved.getPrefix());
        auditLogService.record(currentUsername(), "ACTUALIZAR", EntityType.RESOLUCION,
                saved.getId().toString(), saved.getPrefix() + " " + saved.getResolutionNumber(),
                "Resolución DIAN '" + saved.getPrefix() + "' actualizada");
        return toResponse(saved);
    }

    // ── mapper ────────────────────────────────────────────────────────────────

    private ResolutionResponse toResponse(Resolution r) {
        return new ResolutionResponse(
                r.getId(),
                r.getCompany().getId(),
                r.getPrefix(),
                r.getResolutionNumber(),
                r.getResolutionDate(),
                r.getRangeFrom(),
                r.getRangeTo(),
                r.getCurrentNumber(),
                r.getValidFrom(),
                r.getValidUntil(),
                r.isActive(),
                r.getCreatedAt()
        );
    }
}
