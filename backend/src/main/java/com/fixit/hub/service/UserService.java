package com.fixit.hub.service;

import com.fixit.hub.domain.entity.UserRole;
import com.fixit.hub.dto.UserResponse;
import java.util.List;
import java.util.UUID;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse updateUserRole(UUID userId, UserRole role);
}
