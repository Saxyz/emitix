package com.unimag.emitix.service;

import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.dto.UpdateUserRequest;
import com.unimag.emitix.dto.UserRequest;
import com.unimag.emitix.dto.UserResponse;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.User;
import com.unimag.emitix.entity.enums.Role;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private UserService userService;

    private Company company;
    private User user;
    private UUID companyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        userId    = UUID.randomUUID();

        company = Company.builder().documentNumber("900123456-7").legalName("Demo S.A.S").build();
        company.setId(companyId);

        user = User.builder()
                .username("operador1")
                .email("op@demo.com")
                .fullName("Operador Uno")
                .role(Role.ACCOUNTANT)
                .company(company)
                .isActive(true)
                .build();
        user.setId(userId);
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    void findAll_withCompanyId_returnsPageFilteredByCompany() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page   = new PageImpl<>(List.of(user));
        when(userRepository.findByCompanyId(companyId, pageable)).thenReturn(page);

        PageResponse<UserResponse> result = userService.findAll(companyId, pageable);

        assertEquals(1, result.content().size());
        assertEquals("operador1", result.content().get(0).username());
        verify(userRepository).findByCompanyId(companyId, pageable);
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void findAll_withNullCompanyId_returnsAllUsers() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page   = new PageImpl<>(List.of(user));
        when(userRepository.findAll(pageable)).thenReturn(page);

        PageResponse<UserResponse> result = userService.findAll(null, pageable);

        assertEquals(1, result.content().size());
        verify(userRepository).findAll(pageable);
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    void findById_existingUser_returnsResponse() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UserResponse result = userService.findById(userId);

        assertNotNull(result);
        assertEquals("operador1", result.username());
        assertEquals(companyId, result.companyId());
    }

    @Test
    void findById_notFound_throwsResourceNotFoundException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.findById(userId));
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void create_successful() {
        UserRequest req = new UserRequest("nuevo", "pass123", "nuevo@demo.com",
                "Nuevo Usuario", "300111", "ACCOUNTANT");

        when(userRepository.existsByUsername("nuevo")).thenReturn(false);
        when(userRepository.existsByEmail("nuevo@demo.com")).thenReturn(false);
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(passwordEncoder.encode("pass123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        UserResponse result = userService.create(req, companyId);

        assertNotNull(result);
        assertEquals("nuevo", result.username());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void create_duplicateUsername_throwsBusinessException() {
        UserRequest req = new UserRequest("operador1", "pass", "otro@demo.com",
                "Otro", null, "ACCOUNTANT");
        when(userRepository.existsByUsername("operador1")).thenReturn(true);

        assertThrows(BusinessException.class, () -> userService.create(req, companyId));
        verify(userRepository, never()).save(any());
    }

    @Test
    void create_duplicateEmail_throwsBusinessException() {
        UserRequest req = new UserRequest("nuevo2", "pass", "op@demo.com",
                "Nuevo2", null, "ACCOUNTANT");
        when(userRepository.existsByUsername("nuevo2")).thenReturn(false);
        when(userRepository.existsByEmail("op@demo.com")).thenReturn(true);

        assertThrows(BusinessException.class, () -> userService.create(req, companyId));
        verify(userRepository, never()).save(any());
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void update_successful() {
        UpdateUserRequest req = new UpdateUserRequest(null, "Nombre Nuevo", "301", "VIEWER", null);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse result = userService.update(userId, req);

        assertEquals("Nombre Nuevo", user.getFullName());
        assertEquals(Role.VIEWER, user.getRole());
        assertNotNull(result);
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void delete_existingUser_deletesSuccessfully() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        userService.delete(userId);

        verify(userRepository).delete(user);
    }

    @Test
    void delete_notFound_throwsResourceNotFoundException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> userService.delete(userId));
        verify(userRepository, never()).delete(any(User.class));
    }
}
