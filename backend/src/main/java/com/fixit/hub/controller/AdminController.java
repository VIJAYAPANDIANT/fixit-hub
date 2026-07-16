package com.fixit.hub.controller;

import com.fixit.hub.domain.entity.User;
import com.fixit.hub.domain.entity.UserRole;
import com.fixit.hub.dto.UserResponse;
import com.fixit.hub.repository.jpa.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Operations", description = "Endpoints restricted to administrators")
public class AdminController {

    private final UserRepository userRepository;

    @GetMapping("/users")
    @Operation(summary = "List all platform users")
    public ResponseEntity<List<UserResponse>> listUsers() {
        List<UserResponse> list = userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getEmail(), u.getName(), u.getRole()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PutMapping("/users/{userId}/role")
    @Operation(summary = "Update developer access role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable UUID userId,
            @RequestParam UserRole role
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok(new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole()));
    }
}
