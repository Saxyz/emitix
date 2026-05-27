package com.unimag.emitix.service;

import com.unimag.emitix.dto.BuyerRequest;
import com.unimag.emitix.dto.BuyerResponse;
import com.unimag.emitix.dto.CsvImportResult;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BuyerService {

    private final BuyerRepository buyerRepository;
    private final CompanyRepository companyRepository;
    private final BuyerMapper buyerMapper;

    @Transactional(readOnly = true)
    public PageResponse<BuyerResponse> findAll(UUID companyId, String search, boolean activeOnly, Pageable pageable) {
        String searchParam = (search != null && !search.isBlank()) ? "%" + search.toLowerCase() + "%" : null;
        var page = activeOnly
                ? buyerRepository.findActiveByCompanyAndSearch(companyId, searchParam, pageable)
                : buyerRepository.findByCompanyAndSearch(companyId, searchParam, pageable);
        return PageResponse.of(page.map(buyerMapper::toResponse));
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
        if (request.isActive() != null) buyer.setActive(request.isActive());

        Buyer saved = buyerRepository.save(buyer);
        log.info("Buyer '{}' updated", saved.getDocumentNumber());
        return buyerMapper.toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Buyer buyer = getBuyerOrThrow(id);
        try {
            buyerRepository.delete(buyer);
            buyerRepository.flush();
            log.info("Buyer '{}' deleted (hard delete)", buyer.getDocumentNumber());
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException("No se puede eliminar el cliente '" + buyer.getFullName() +
                    "' porque tiene facturas asociadas. Puedes desactivarlo desde Editar.");
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
                if (row == 1) continue;

                String[] cols = line.split(",", -1);
                if (cols.length < 5) {
                    errors.add("Fila " + row + ": columnas insuficientes (mínimo: documentNumber,documentType,fullName,organizationType,fiscalRegime)");
                    skipped++;
                    continue;
                }

                try {
                    String documentNumber   = cols[0].trim();
                    String documentType     = cols[1].trim().toUpperCase();
                    String fullName         = cols[2].trim();
                    String organizationType = cols[3].trim().toUpperCase();
                    String fiscalRegime     = cols.length > 4 && !cols[4].isBlank() ? cols[4].trim().toUpperCase() : "RES";
                    String rawEmail         = cols.length > 5 ? cols[5].trim() : null;
                    String phone            = cols.length > 6 && !cols[6].isBlank() ? cols[6].trim() : null;
                    String address          = cols.length > 7 && !cols[7].isBlank() ? cols[7].trim() : null;
                    String city             = cols.length > 8 && !cols[8].isBlank() ? cols[8].trim() : null;
                    String department       = cols.length > 9 && !cols[9].isBlank() ? cols[9].trim() : null;
                    String country          = cols.length > 10 && !cols[10].isBlank() ? cols[10].trim() : "CO";

                    if (documentNumber.isBlank() || fullName.isBlank()) {
                        errors.add("Fila " + row + ": documentNumber y fullName son requeridos");
                        skipped++;
                        continue;
                    }

                    // Validate enums
                    try { DocumentType.valueOf(documentType); } catch (IllegalArgumentException e) {
                        errors.add("Fila " + row + ": documentType inválido '" + documentType + "'. Usar: NIT, CC, CE, PA, TI, RC");
                        skipped++;
                        continue;
                    }
                    try { OrganizationType.valueOf(organizationType); } catch (IllegalArgumentException e) {
                        errors.add("Fila " + row + ": organizationType inválido '" + organizationType + "'. Usar: JURIDICA o NATURAL");
                        skipped++;
                        continue;
                    }
                    try { FiscalRegime.valueOf(fiscalRegime); } catch (IllegalArgumentException e) {
                        errors.add("Fila " + row + ": fiscalRegime inválido '" + fiscalRegime + "'. Usar: RES o NRES");
                        skipped++;
                        continue;
                    }

                    // Validate email format; if invalid, import with null email instead of failing the row
                    String email = (rawEmail != null && !rawEmail.isBlank()
                            && rawEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) ? rawEmail : null;

                    BuyerRequest req = new BuyerRequest(
                            documentNumber, documentType, fullName, organizationType,
                            fiscalRegime, email, phone, address, city, department, null, country, null);

                    if (buyerRepository.existsByCompanyIdAndDocumentNumber(companyId, documentNumber)) {
                        buyerRepository.findByCompanyIdAndDocumentNumber(companyId, documentNumber)
                                .ifPresent(b -> {
                                    b.setFullName(req.fullName());
                                    b.setOrganizationType(OrganizationType.valueOf(req.organizationType()));
                                    b.setFiscalRegime(req.fiscalRegime() != null ? FiscalRegime.valueOf(req.fiscalRegime()) : null);
                                    b.setEmail(req.email());
                                    b.setPhone(req.phone());
                                    b.setAddress(req.address());
                                    b.setCity(req.city());
                                    b.setDepartment(req.department());
                                    if (req.country() != null) b.setCountry(req.country());
                                    buyerRepository.save(b);
                                });
                    } else {
                        create(req, companyId);
                    }
                    imported++;
                } catch (BusinessException e) {
                    errors.add("Fila " + row + ": " + e.getMessage());
                    skipped++;
                } catch (Exception e) {
                    errors.add("Fila " + row + ": error inesperado - " + e.getMessage());
                    skipped++;
                }
            }
        } catch (Exception e) {
            throw new BusinessException("Error al leer el archivo CSV: " + e.getMessage());
        }

        log.info("CSV import buyers for company {}: {} imported, {} skipped, {} errors", companyId, imported, skipped, errors.size());
        return new CsvImportResult(imported, skipped, errors);
    }

    private Buyer getBuyerOrThrow(UUID id) {
        return buyerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comprador", "id", id));
    }
}
