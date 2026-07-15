package com.fixit.hub.controller;

import com.fixit.hub.domain.entity.IssueDifficulty;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;
import com.fixit.hub.dto.ErrorRequest;
import com.fixit.hub.dto.IssueResponse;
import com.fixit.hub.service.IssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/errors")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Error Management", description = "Endpoints for manual error CRUD, filtering, searching, and sorting")
public class ErrorController {

    private final IssueService issueService;

    @PostMapping
    @Operation(summary = "Create manual error log entry", description = "Allows administrators and developers to manually register a documented bug")
    public ResponseEntity<IssueResponse> createError(@Valid @RequestBody ErrorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(issueService.createError(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update error log entry details", description = "Modifies error details like code snippet, difficulty, root cause, or verified fix")
    public ResponseEntity<IssueResponse> updateError(
            @PathVariable UUID id,
            @Valid @RequestBody ErrorRequest request
    ) {
        return ResponseEntity.ok(issueService.updateError(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete error signature", description = "Permanently removes an error profile from the workspace. Restricted to ADMIN role.")
    public ResponseEntity<Map<String, String>> deleteError(@PathVariable UUID id) {
        issueService.deleteError(id);
        return ResponseEntity.ok(Map.of("message", "Error profile deleted successfully."));
    }

    @GetMapping
    @Operation(summary = "Get sorted & filtered errors list", description = "Query issues matching specific status, severity, difficulty, text, and sorted dynamically")
    public ResponseEntity<List<IssueResponse>> getFilteredErrors(
            @RequestParam UUID projectId,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssueSeverity severity,
            @RequestParam(required = false) IssueDifficulty difficulty,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "lastSeen") String sortBy
    ) {
        return ResponseEntity.ok(issueService.getFilteredIssues(projectId, status, severity, difficulty, search, sortBy));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get error detail by ID", description = "Returns detailed exception fields and increments the view counter")
    public ResponseEntity<IssueResponse> getErrorById(@PathVariable UUID id) {
        return ResponseEntity.ok(issueService.getIssueById(id));
    }
}
