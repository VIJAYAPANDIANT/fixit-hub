package com.fixit.hub.service;

import com.fixit.hub.dto.AuthRequest;
import com.fixit.hub.dto.AuthResponse;
import com.fixit.hub.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(AuthRequest request);
    void verifyEmail(String token);
    void forgotPassword(String email);
    void resetPassword(String token, String newPassword);
    AuthResponse refreshToken(String refreshToken);
    void logout(String email);
}
