package com.fixit.hub.dto;

import com.fixit.hub.domain.entity.UserRole;
import java.util.UUID;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    UUID userId,
    String email,
    String name,
    UserRole role
) {}
