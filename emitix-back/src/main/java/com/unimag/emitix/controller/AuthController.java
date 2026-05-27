package com.unimag.emitix.controller;

import com.unimag.emitix.dto.*;
import com.unimag.emitix.service.AuthService;
import com.unimag.emitix.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.logout(authHeader);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /**
     * Devuelve los datos del usuario autenticado actualmente.
     * El frontend lo usa para hidratar el AuthContext al recargar la página.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MeResponse> me(Principal principal) {
        return ResponseEntity.ok(authService.me(principal.getName()));
    }

    /**
     * Inicia el flujo de recuperación de contraseña.
     * Por seguridad (anti-enumeración) siempre devuelve 200 aunque el email no exista.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.generateOtp(request.email());
        return ResponseEntity.ok().build();
    }

    /**
     * Restablece la contraseña usando el OTP recibido por email.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.email(), request.otp(), request.newPassword());
        return ResponseEntity.ok().build();
    }
}
