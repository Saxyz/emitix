package com.unimag.emitix.config;

import com.unimag.emitix.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── Público: auth + catálogos ──────────────────────────────────
                .requestMatchers("/api/auth/login",
                                 "/api/auth/logout",
                                 "/api/auth/register",
                                 "/api/auth/forgot-password",
                                 "/api/auth/reset-password").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/catalogs/**").permitAll()

                // ── Auth: /me requiere estar autenticado ───────────────────────
                .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()

                // ── Company ────────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET,  "/api/company")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "VIEWER")
                .requestMatchers(HttpMethod.PUT,  "/api/company")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN")

                // ── Resolutions ────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET,  "/api/company/resolutions/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "VIEWER")
                .requestMatchers(HttpMethod.POST, "/api/company/resolutions/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.PUT,  "/api/company/resolutions/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN")

                // ── Users ──────────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET,    "/api/users/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
                .requestMatchers(HttpMethod.POST,   "/api/users/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/users/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN")

                // ── Buyers ────────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET,  "/api/buyers/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "VIEWER")
                .requestMatchers(HttpMethod.POST, "/api/buyers/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PUT,  "/api/buyers/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")

                // ── Products ──────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET,    "/api/products/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "VIEWER")
                .requestMatchers(HttpMethod.POST,   "/api/products/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PUT,    "/api/products/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN")

                // ── Invoices ──────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET,  "/api/invoices/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "VIEWER")
                .requestMatchers(HttpMethod.POST, "/api/invoices")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
                .requestMatchers(HttpMethod.PUT,  "/api/invoices/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
                // /confirm y /cancel son POST a sub-recursos → manejados por @PreAuthorize en controller
                .requestMatchers(HttpMethod.POST, "/api/invoices/*/confirm")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")
                .requestMatchers(HttpMethod.POST, "/api/invoices/*/cancel")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN")

                // ── Reports ───────────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/reports/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "VIEWER")

                // ── Activity log ──────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/activity/**")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN")

                // ── Notifications ────────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/api/notifications")
                    .hasAnyRole("SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "VIEWER")

                //El resto necesita autenticación
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
