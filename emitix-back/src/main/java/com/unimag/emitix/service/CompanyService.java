package com.unimag.emitix.service;

import com.unimag.emitix.dto.CompanyRequest;
import com.unimag.emitix.dto.CompanyResponse;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.User;
import com.unimag.emitix.entity.enums.EntityType;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.mapper.CompanyMapper;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final CompanyMapper companyMapper;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public CompanyResponse getCompanyForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
        Company company = user.getCompany();
        if (company == null) {
            throw new ResourceNotFoundException("Empresa emisora", "usuario", username);
        }
        return companyMapper.toResponse(company);
    }

    @Transactional
    public CompanyResponse updateCompany(CompanyRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "username", username));
        Company company = user.getCompany();
        if (company == null) {
            throw new ResourceNotFoundException("Empresa emisora", "usuario", username);
        }
        companyMapper.updateFromRequest(request, company);
        Company saved = companyRepository.save(company);
        log.info("Company updated: {} by user {}", saved.getDocumentNumber(), username);
        auditLogService.record(username, "ACTUALIZAR", EntityType.EMPRESA,
                saved.getId().toString(), saved.getDocumentNumber(),
                "Datos de empresa '" + saved.getLegalName() + "' actualizados");
        return companyMapper.toResponse(saved);
    }
}
