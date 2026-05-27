package com.unimag.emitix.service;

import com.unimag.emitix.dto.ResolutionRequest;
import com.unimag.emitix.dto.ResolutionResponse;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.Resolution;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.ResolutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResolutionService {

    private final ResolutionRepository resolutionRepository;
    private final CompanyRepository companyRepository;

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

        return toResponse(resolutionRepository.save(resolution));
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

        return toResponse(resolutionRepository.save(resolution));
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
