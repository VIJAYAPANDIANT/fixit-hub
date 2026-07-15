package com.fixit.hub.controller;

import com.fixit.hub.dto.*;
import com.fixit.hub.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user registration, verification, JWT login, and session refresh")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user profile and triggers verification emails")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @GetMapping("/verify")
    @Operation(summary = "Verify account email", description = "Validates the registration verification token to activate user accounts")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully. Account is now active."));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials", description = "Validates credentials and yields a session JWT Access Token + Refresh Token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token", description = "Validates the refresh token and yields a new access token and rotated refresh token")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.refreshToken()));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password request", description = "Generates and sends a password recovery token to the registered email")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.ok(Map.of("message", "Recovery instructions have been sent if the email is registered."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset account password", description = "Applies a new password using the valid reset recovery token")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password has been successfully updated."));
    }

    @PostMapping("/logout")
    @Operation(summary = "Log out user session", description = "Clears and revokes active user refresh tokens in the database")
    public ResponseEntity<Map<String, String>> logout(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails != null) {
            authService.logout(userDetails.getUsername());
        }
        return ResponseEntity.ok(Map.of("message", "Session logged out successfully. Tokens revoked."));
    }
}
