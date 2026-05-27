package com.unimag.emitix.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unimag.emitix.dto.LoginRequest;
import com.unimag.emitix.entity.User;
import com.unimag.emitix.entity.enums.Role;
import com.unimag.emitix.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        User user = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .email("admin@emitix.com")
                .fullName("Admin Test")
                .role(Role.ADMIN)
                .isActive(true)
                .build();
        userRepository.save(user);
    }

    @Test
    void login_Successful() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin", "admin123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.fullName").value("Admin Test"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void login_Failure_WrongPassword() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_Failure_NonExistentUser() throws Exception {
        LoginRequest loginRequest = new LoginRequest("nonexistent", "admin123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_Successful() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer mock-token"))
                .andExpect(status().isNoContent());
    }
}
