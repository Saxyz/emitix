package com.unimag.emitix.service;

import com.unimag.emitix.dto.LoginRequest;
import com.unimag.emitix.dto.LoginResponse;
import com.unimag.emitix.entity.User;
import com.unimag.emitix.entity.enums.Role;
import com.unimag.emitix.repository.CompanyRepository;
import com.unimag.emitix.repository.UserRepository;
import com.unimag.emitix.security.JwtTokenProvider;
import com.unimag.emitix.security.TokenBlacklistService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_Successful() {
        // Arrange
        LoginRequest request = new LoginRequest("admin", "admin123");
        User user = User.builder()
                .username("admin")
                .fullName("Administrador")
                .role(Role.ADMIN)
                .isActive(true)
                .build();

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(user);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtTokenProvider.generateToken(user)).thenReturn("mocked-jwt-token");

        // Act
        LoginResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("mocked-jwt-token", response.token());
        assertEquals("admin", response.username());
        assertEquals("Administrador", response.fullName());
        assertEquals("ADMIN", response.role());
        assertNull(response.companyId());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(jwtTokenProvider).generateToken(user);
    }

    @Test
    void login_Failure_InvalidCredentials() {
        // Arrange
        LoginRequest request = new LoginRequest("admin", "wrong_password");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // Act & Assert
        assertThrows(BadCredentialsException.class, () -> authService.login(request));
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    void logout_Successful_WithBearerPrefix() {
        // Act
        authService.logout("Bearer mocked-token");

        // Assert
        verify(tokenBlacklistService).blacklist("mocked-token");
    }

    @Test
    void logout_Successful_WithoutBearerPrefix() {
        // Act
        authService.logout("mocked-token");

        // Assert
        verify(tokenBlacklistService).blacklist("mocked-token");
    }

    @Test
    void logout_NullToken() {
        // Act
        authService.logout(null);

        // Assert
        verify(tokenBlacklistService).blacklist(null);
    }

    @Test
    void shouldMatchPassword() {
        String rawPassword = "operador123";

        String storedHash = "$2a$10$8K1p/a0dR1xqM8eeXLO1W.g8N2dU5mhHMWuHLV6a8O39EZGRqDhLe";

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        boolean matches = encoder.matches(rawPassword, storedHash);

        System.out.println("Password matches: " + matches);

        assertTrue(matches);
    }

    @Test
    void shouldGenerateNewHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String hash = encoder.encode("operador123");

        System.out.println("Generated hash: " + hash);
    }
}
