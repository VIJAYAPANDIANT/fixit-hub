package com.fixit.hub.controller;

import com.fixit.hub.domain.entity.UserRole;
import com.fixit.hub.dto.UserResponse;
import com.fixit.hub.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Operations", description = "Endpoints restricted to administrators")
public class AdminController {

    private final UserService userService;

    @GetMapping("/users")
    @Operation(summary = "List all platform users")
    public ResponseEntity<List<UserResponse>> listUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/users/{userId}/role")
    @Operation(summary = "Update developer access role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable UUID userId,
            @RequestParam UserRole role
    ) {
        return ResponseEntity.ok(userService.updateUserRole(userId, role));
    }
}
