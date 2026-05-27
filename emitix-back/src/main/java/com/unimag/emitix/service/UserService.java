package com.unimag.emitix.service;

import com.unimag.emitix.dto.PageResponse;
import com.unimag.emitix.dto.UpdateUserRequest;
import com.unimag.emitix.dto.UserRequest;
import com.unimag.emitix.dto.UserResponse;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.User;
import com.unimag.emitix.entity.enums.EntityType;
import com.unimag.emitix.entity.enums.Role;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.exception.ResourceNotFoundException;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    private String currentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "system";
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> findAll(UUID companyId, Pageable pageable) {
        Page<User> page;
        if (companyId == null) {
            // SUPER_ADMIN: ve todos los usuarios
            page = userRepository.findAll(pageable);
        } else {
            page = userRepository.findByCompanyId(companyId, pageable);
        }
        return PageResponse.of(page.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        return toResponse(getUserOrThrow(id));
    }

    @Transactional
    public UserResponse create(UserRequest request, UUID companyId) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessException("El username '" + request.username() + "' ya está en uso");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("El email '" + request.email() + "' ya está registrado");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Empresa", "id", companyId));

        User user = User.builder()
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .email(request.email())
                .fullName(request.fullName())
                .phone(request.phone())
                .role(Role.valueOf(request.role()))
                .company(company)
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        log.info("User '{}' created in company '{}'", saved.getUsername(), companyId);
        auditLogService.record(currentUsername(), "CREAR", EntityType.USUARIO,
                saved.getId().toString(), saved.getUsername(),
                "Usuario '" + saved.getUsername() + "' creado con rol " + saved.getRole().name());
        return toResponse(saved);
    }

    @Transactional
    public UserResponse update(UUID id, UpdateUserRequest request) {
        User user = getUserOrThrow(id);

        if (request.fullName() != null) user.setFullName(request.fullName());
        if (request.phone() != null) user.setPhone(request.phone());
        if (request.email() != null) {
            if (!user.getEmail().equals(request.email()) && userRepository.existsByEmail(request.email())) {
                throw new BusinessException("El email '" + request.email() + "' ya está registrado");
            }
            user.setEmail(request.email());
        }
        if (request.role() != null) user.setRole(Role.valueOf(request.role()));
        if (request.isActive() != null) user.setActive(request.isActive());

        User saved = userRepository.save(user);
        log.info("User '{}' updated", saved.getUsername());
        auditLogService.record(currentUsername(), "ACTUALIZAR", EntityType.USUARIO,
                saved.getId().toString(), saved.getUsername(),
                "Usuario '" + saved.getUsername() + "' actualizado");
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        User user = getUserOrThrow(id);
        userRepository.delete(user);
        log.info("User '{}' deleted", user.getUsername());
        auditLogService.record(currentUsername(), "ELIMINAR", EntityType.USUARIO,
                user.getId().toString(), user.getUsername(),
                "Usuario '" + user.getUsername() + "' eliminado");
    }

    private User getUserOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(
                u.getId(),
                u.getCompany() != null ? u.getCompany().getId() : null,
                u.getUsername(),
                u.getEmail(),
                u.getFullName(),
                u.getPhone(),
                u.getRole().name(),
                u.isActive(),
                u.getCreatedAt(),
                u.getUpdatedAt()
        );
    }
}
