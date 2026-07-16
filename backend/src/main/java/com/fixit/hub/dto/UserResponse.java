package com.fixit.hub.dto;

import com.fixit.hub.domain.entity.UserRole;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String name,
    UserRole role
) {}
