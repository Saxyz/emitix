package com.unimag.emitix.service;

import com.unimag.emitix.dto.LoginRequest;
import com.unimag.emitix.dto.LoginResponse;
import com.unimag.emitix.dto.MeResponse;
import com.unimag.emitix.dto.RegisterRequest;
import com.unimag.emitix.entity.Company;
import com.unimag.emitix.entity.User;
import com.unimag.emitix.entity.enums.EntityType;
import com.unimag.emitix.entity.enums.Role;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.UserRepository;
import com.unimag.emitix.security.JwtTokenProvider;
import com.unimag.emitix.security.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    private String currentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "system";
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
            User user = (User) authentication.getPrincipal();
            String token = jwtTokenProvider.generateToken(user);
            log.info("User '{}' logged in successfully", user.getUsername());
            auditLogService.record(request.username(), "LOGIN", EntityType.AUTH,
                    user.getId().toString(), request.username(),
                    "Inicio de sesión exitoso");
            java.util.UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;
            return new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole().name(), companyId);
        } catch (org.springframework.security.core.AuthenticationException e) {
            auditLogService.recordFailure(request.username(), "LOGIN", EntityType.AUTH,
                    "N/A", request.username(),
                    "Intento de inicio de sesión fallido",
                    "Credenciales inválidas");
            throw e;
        }
    }

    public void logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        String username = currentUsername();
        tokenBlacklistService.blacklist(token);
        log.info("Token invalidated successfully (logout)");
        auditLogService.record(username, "LOGOUT", EntityType.AUTH,
                "N/A", username,
                "Sesión cerrada exitosamente");
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public MeResponse me(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado: " + username));
        java.util.UUID companyId = user.getCompany() != null ? user.getCompany().getId() : null;
        return new MeResponse(
                user.getId(),
                companyId,
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole().name(),
                user.isActive()
        );
    }

    @org.springframework.transaction.annotation.Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("El username '" + request.username() + "' ya está en uso");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("El email '" + request.email() + "' ya está registrado");
        }

        // Crear empresa y ADMIN en una sola transacción (onboarding multi-tenant)
        Company company = Company.builder()
                .documentNumber(request.companyDocumentNumber())
                .legalName(request.companyLegalName())
                .organizationType(request.organizationType())
                .documentType(request.documentType())
                .build();
        company = companyRepository.save(company);

        User user = User.builder()
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .email(request.email())
                .fullName(request.fullName())
                .phone(request.phone())
                .role(Role.ADMIN)
                .company(company)
                .isActive(true)
                .build();

        userRepository.save(user);
        log.info("User '{}' registered successfully with company '{}'", user.getUsername(), company.getDocumentNumber());
        auditLogService.record(user.getUsername(), "REGISTRO", EntityType.AUTH,
                user.getId() != null ? user.getId().toString() : "N/A", user.getUsername(),
                "Registro exitoso: empresa '" + company.getLegalName() + "'");

        String token = jwtTokenProvider.generateToken(user);
        return new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole().name(), company.getId());
    }
}
