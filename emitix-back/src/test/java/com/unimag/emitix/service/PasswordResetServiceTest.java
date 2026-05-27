package com.unimag.emitix.service;

import com.unimag.emitix.entity.PasswordResetToken;
import com.unimag.emitix.entity.User;
import com.unimag.emitix.entity.enums.Role;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.repository.PasswordResetTokenRepository;
import com.unimag.emitix.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock private PasswordResetTokenRepository tokenRepository;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private PasswordResetService passwordResetService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .username("admin")
                .email("admin@demo.com")
                .password("hashedOldPassword")
                .fullName("Admin Demo")
                .role(Role.ADMIN)
                .isActive(true)
                .build();
    }

    // ── generateOtp ───────────────────────────────────────────────────────────

    @Test
    void generateOtp_existingEmail_savesToken() {
        when(userRepository.existsByEmail("admin@demo.com")).thenReturn(true);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$10$hashedOtp");
        when(tokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        passwordResetService.generateOtp("admin@demo.com");

        verify(tokenRepository).invalidatePreviousTokens("admin@demo.com");
        verify(tokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void generateOtp_nonExistingEmail_doesNotSaveToken() {
        // Anti-enumeración: no revela si el email existe
        when(userRepository.existsByEmail("noexiste@demo.com")).thenReturn(false);

        passwordResetService.generateOtp("noexiste@demo.com");

        verify(tokenRepository).invalidatePreviousTokens("noexiste@demo.com");
        verify(tokenRepository, never()).save(any());
    }

    // ── resetPassword ─────────────────────────────────────────────────────────

    @Test
    void resetPassword_validOtp_changesPassword() {
        PasswordResetToken token = PasswordResetToken.builder()
                .userEmail("admin@demo.com")
                .otpHash("$2a$10$hashedOtp")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();

        when(tokenRepository.findFirstByUserEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                eq("admin@demo.com"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.matches("123456", "$2a$10$hashedOtp")).thenReturn(true);
        when(userRepository.findByEmail("admin@demo.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("nuevaClave123")).thenReturn("$2a$10$newHash");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(tokenRepository.save(any(PasswordResetToken.class))).thenReturn(token);

        passwordResetService.resetPassword("admin@demo.com", "123456", "nuevaClave123");

        assertEquals("$2a$10$newHash", user.getPassword());
        assertTrue(token.isUsed());
        verify(userRepository).save(user);
        verify(tokenRepository).save(token);
    }

    @Test
    void resetPassword_expiredToken_throwsBusinessException() {
        when(tokenRepository.findFirstByUserEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                eq("admin@demo.com"), any(LocalDateTime.class)))
                .thenReturn(Optional.empty());

        assertThrows(BusinessException.class,
                () -> passwordResetService.resetPassword("admin@demo.com", "123456", "nueva123"));
    }

    @Test
    void resetPassword_wrongOtp_throwsBusinessException() {
        PasswordResetToken token = PasswordResetToken.builder()
                .userEmail("admin@demo.com")
                .otpHash("$2a$10$hashedOtp")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();

        when(tokenRepository.findFirstByUserEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                eq("admin@demo.com"), any(LocalDateTime.class)))
                .thenReturn(Optional.of(token));
        when(passwordEncoder.matches("999999", "$2a$10$hashedOtp")).thenReturn(false);

        assertThrows(BusinessException.class,
                () -> passwordResetService.resetPassword("admin@demo.com", "999999", "nueva123"));

        verify(userRepository, never()).save(any());
    }
}
