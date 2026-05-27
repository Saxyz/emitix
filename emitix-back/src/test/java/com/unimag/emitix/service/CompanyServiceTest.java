package com.unimag.emitix.service;

import com.unimag.emitix.dto.CompanyRequest;
import com.unimag.emitix.dto.CompanyResponse;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.User;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.mapper.CompanyMapper;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock private CompanyRepository companyRepository;
    @Mock private UserRepository userRepository;
    @Mock private CompanyMapper companyMapper;

    @InjectMocks private CompanyService companyService;

    private Company company;
    private User user;
    private static final String USERNAME = "testuser";

    @BeforeEach
    void setUp() {
        company = Company.builder()
                .documentNumber("900123456-7")
                .legalName("Demo S.A.S")
                .address("Calle 1 # 2-3")
                .city("Bogotá")
                .build();
        company.setId(UUID.randomUUID());

        user = User.builder()
                .username(USERNAME)
                .company(company)
                .build();
    }

    // ── getCompanyForUser ─────────────────────────────────────────────────────

    @Test
    void getCompanyForUser_found_returnsResponse() {
        CompanyResponse response = new CompanyResponse(
                company.getId(), company.getDocumentNumber(), company.getLegalName(),
                null, null, null, "CO", null, null, null);

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        when(companyMapper.toResponse(company)).thenReturn(response);

        CompanyResponse result = companyService.getCompanyForUser(USERNAME);

        assertNotNull(result);
        assertEquals("900123456-7", result.documentNumber());
        verify(userRepository).findByUsername(USERNAME);
        verify(companyMapper).toResponse(company);
    }

    @Test
    void getCompanyForUser_userNotFound_throwsResourceNotFoundException() {
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> companyService.getCompanyForUser(USERNAME));
        verify(companyMapper, never()).toResponse(any());
    }

    @Test
    void getCompanyForUser_userHasNoCompany_throwsResourceNotFoundException() {
        User userWithoutCompany = User.builder().username(USERNAME).company(null).build();
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(userWithoutCompany));

        assertThrows(ResourceNotFoundException.class,
                () -> companyService.getCompanyForUser(USERNAME));
        verify(companyMapper, never()).toResponse(any());
    }

    // ── updateCompany ─────────────────────────────────────────────────────────

    @Test
    void updateCompany_successful() {
        CompanyRequest req = new CompanyRequest("900123456-7", "Demo Actualizada S.A.S",
                "Carrera 10 # 5-20", "Medellín", "Antioquia", "CO",
                "+57 604 111 2222", "info@demo.com", null);

        CompanyResponse response = new CompanyResponse(
                company.getId(), "900123456-7", "Demo Actualizada S.A.S",
                null, null, null, "CO", null, null, null);

        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(user));
        doNothing().when(companyMapper).updateFromRequest(req, company);
        when(companyRepository.save(company)).thenReturn(company);
        when(companyMapper.toResponse(company)).thenReturn(response);

        CompanyResponse result = companyService.updateCompany(req, USERNAME);

        assertNotNull(result);
        verify(companyRepository).save(company);
        verify(companyMapper).updateFromRequest(req, company);
    }

    @Test
    void updateCompany_userNotFound_throwsResourceNotFoundException() {
        CompanyRequest req = new CompanyRequest("000", "X", null, null,
                null, null, null, null, null);
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> companyService.updateCompany(req, USERNAME));
        verify(companyRepository, never()).save(any());
    }

    @Test
    void updateCompany_userHasNoCompany_throwsResourceNotFoundException() {
        CompanyRequest req = new CompanyRequest("000", "X", null, null,
                null, null, null, null, null);
        User userWithoutCompany = User.builder().username(USERNAME).company(null).build();
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(userWithoutCompany));

        assertThrows(ResourceNotFoundException.class,
                () -> companyService.updateCompany(req, USERNAME));
        verify(companyRepository, never()).save(any());
    }
}
