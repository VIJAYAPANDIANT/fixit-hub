package com.fixit.hub.service.impl;

import com.fixit.hub.domain.entity.User;
import com.fixit.hub.domain.entity.UserRole;
import com.fixit.hub.dto.UserResponse;
import com.fixit.hub.exception.ResourceNotFoundException;
import com.fixit.hub.repository.jpa.UserRepository;
import com.fixit.hub.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getEmail(), u.getName(), u.getRole()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(UUID userId, UserRole role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        user.setRole(role);
        userRepository.save(user);
        return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
    }
}
