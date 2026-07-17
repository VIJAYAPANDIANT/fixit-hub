package com.fixit.hub.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fixit.hub.domain.entity.UserRole;
import com.fixit.hub.dto.AuthRequest;
import com.fixit.hub.dto.AuthResponse;
import com.fixit.hub.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class UserFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testUserRegistrationLoginAndAuthFlow() throws Exception {
        String email = "integration_test_" + System.currentTimeMillis() + "@example.com";
        String password = "securepassword123";
        String name = "Integration Tester";

        // 1. Register User (as ADMIN so they are active automatically)
        RegisterRequest registerRequest = new RegisterRequest(email, password, name, UserRole.ADMIN);
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        AuthResponse registerResponse = objectMapper.readValue(
                registerResult.getResponse().getContentAsString(),
                AuthResponse.class
        );
        assertThat(registerResponse.accessToken()).isNotEmpty();
        assertThat(registerResponse.email()).isEqualTo(email);

        // 2. Login User
        AuthRequest loginRequest = new AuthRequest(email, password);
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        AuthResponse loginResponse = objectMapper.readValue(
                loginResult.getResponse().getContentAsString(),
                AuthResponse.class
        );
        assertThat(loginResponse.accessToken()).isNotEmpty();

        // 3. Request Protected Endpoints (with JWT Bearer token)
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + loginResponse.accessToken()))
                .andExpect(status().isOk());

        // 4. Request Protected Endpoint without token (should fail)
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        // 5. Request Protected Endpoint with invalid token (should fail)
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid_token_here"))
                .andExpect(status().isUnauthorized());
    }
}
