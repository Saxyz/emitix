package com.unimag.emitix.service;

import com.unimag.emitix.entity.PasswordResetToken;
import com.unimag.emitix.entity.User;
import com.unimag.emitix.exception.BusinessException;
import com.unimag.emitix.repository.PasswordResetTokenRepository;
import com.unimag.emitix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int OTP_EXPIRY_MINUTES = 15;

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /**
     * Genera y almacena un OTP de 6 dígitos para el email dado.
     * Por seguridad, no revela si el email existe (retorna vacío en ambos casos).
     */
    @Transactional
    public void generateOtp(String email) {
        // Invalidar tokens anteriores
        tokenRepository.invalidatePreviousTokens(email);

        // Verificar que el usuario existe (silencioso — no revela existencia al exterior)
        if (!userRepository.existsByEmail(email)) {
            log.warn("OTP solicitado para email no registrado: {}", email);
            return; // respuesta idéntica a cuando sí existe (anti-enumeración)
        }

        String otp = generateSixDigitOtp();
        String otpHash = passwordEncoder.encode(otp);

        PasswordResetToken token = PasswordResetToken.builder()
                .userEmail(email)
                .otpHash(otpHash)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();

        tokenRepository.save(token);

        emailService.sendOtpEmail(email, otp, OTP_EXPIRY_MINUTES);
    }

    /**
     * Valida el OTP y cambia la contraseña del usuario.
     */
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        PasswordResetToken token = tokenRepository
                .findFirstByUserEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        email, LocalDateTime.now())
                .orElseThrow(() -> new BusinessException(
                        "El código OTP es inválido o ha expirado"));

        if (!passwordEncoder.matches(otp, token.getOtpHash())) {
            throw new BusinessException("El código OTP es incorrecto");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        log.info("Contraseña restablecida para '{}'", email);
    }

    private String generateSixDigitOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}
