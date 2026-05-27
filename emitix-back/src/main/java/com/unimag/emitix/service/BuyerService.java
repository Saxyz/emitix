package com.unimag.emitix.service;

import com.unimag.emitix.dto.BuyerRequest;
import com.unimag.emitix.dto.BuyerResponse;
import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.entity.Buyer;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.enums.DocumentType;
import com.unimag.emitix.entity.enums.FiscalRegime;
import com.unimag.emitix.entity.enums.OrganizationType;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.mapper.BuyerMapper;
import com.unimag.emitix.repository.BuyerRepository;
import com.unimag.emitix.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BuyerService {

    private final BuyerRepository buyerRepository;
    private final CompanyRepository companyRepository;
    private final BuyerMapper buyerMapper;

    @Transactional(readOnly = true)
    public PageResponse<BuyerResponse> findAll(UUID companyId, String search, Pageable pageable) {
        String searchParam = (search != null && !search.isBlank()) ? "%" + search.toLowerCase() + "%" : null;
        return PageResponse.of(
                buyerRepository.findByCompanyAndSearch(companyId, searchParam, pageable)
                        .map(buyerMapper::toResponse)
        );
    }

    @Transactional(readOnly = true)
    public BuyerResponse findById(UUID id) {
        return buyerMapper.toResponse(getBuyerOrThrow(id));
    }

    @Transactional(readOnly = true)
    public BuyerResponse verifyDocument(UUID companyId, String documentNumber) {
        // Mock: retorna el comprador si existe, lanza 404 si no
        Buyer buyer = buyerRepository.findByCompanyIdAndDocumentNumber(companyId, documentNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Comprador", "documentNumber", documentNumber));
        return buyerMapper.toResponse(buyer);
    }

    @Transactional
    public BuyerResponse create(BuyerRequest request, UUID companyId) {
        if (buyerRepository.existsByCompanyIdAndDocumentNumber(companyId, request.documentNumber())) {
            throw new BusinessException(
                    "Ya existe un comprador con el número de documento '" + request.documentNumber() + "' en esta empresa");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", "id", companyId));

        Buyer buyer = Buyer.builder()
                .company(company)
                .documentNumber(request.documentNumber())
                .documentType(DocumentType.valueOf(request.documentType()))
                .fullName(request.fullName())
                .organizationType(OrganizationType.valueOf(request.organizationType()))
                .fiscalRegime(request.fiscalRegime() != null ? FiscalRegime.valueOf(request.fiscalRegime()) : null)
                .email(request.email())
                .phone(request.phone())
                .address(request.address())
                .city(request.city())
                .department(request.department())
                .postalCode(request.postalCode())
                .country(request.country() != null ? request.country() : "CO")
                .isActive(true)
                .build();

        Buyer saved = buyerRepository.save(buyer);
        log.info("Buyer '{}' created in company '{}'", saved.getDocumentNumber(), companyId);
        return buyerMapper.toResponse(saved);
    }

    @Transactional
    public BuyerResponse update(UUID id, BuyerRequest request) {
        Buyer buyer = getBuyerOrThrow(id);

        buyer.setFullName(request.fullName());
        buyer.setOrganizationType(OrganizationType.valueOf(request.organizationType()));
        buyer.setFiscalRegime(request.fiscalRegime() != null ? FiscalRegime.valueOf(request.fiscalRegime()) : null);
        buyer.setEmail(request.email());
        buyer.setPhone(request.phone());
        buyer.setAddress(request.address());
        buyer.setCity(request.city());
        buyer.setDepartment(request.department());
        buyer.setPostalCode(request.postalCode());
        if (request.country() != null) buyer.setCountry(request.country());

        Buyer saved = buyerRepository.save(buyer);
        log.info("Buyer '{}' updated", saved.getDocumentNumber());
        return buyerMapper.toResponse(saved);
    }

    private Buyer getBuyerOrThrow(UUID id) {
        return buyerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comprador", "id", id));
    }
}
