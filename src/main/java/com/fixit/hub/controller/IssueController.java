package com.fixit.hub.controller;

import com.fixit.hub.domain.document.EventLog;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;
import com.fixit.hub.domain.entity.User;
import com.fixit.hub.dto.CommentRequest;
import com.fixit.hub.dto.CommentResponse;
import com.fixit.hub.dto.IssueResponse;
import com.fixit.hub.service.IssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Issues & Triage", description = "Triage operations, commenting, assignment, and logs lookup")
public class IssueController {

    private final IssueService issueService;

    public record UpdateStatusRequest(IssueStatus status) {}
    public record AssignIssueRequest(UUID userId) {}

    @GetMapping("/projects/{projectId}/issues")
    @Operation(summary = "Get filtered issues list", description = "Query issues matching specific status, severity, and text filters")
    public ResponseEntity<List<IssueResponse>> getFilteredIssues(
            @PathVariable UUID projectId,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssueSeverity severity,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(issueService.getFilteredIssues(projectId, status, severity, null, search, "lastSeen"));
    }

    @GetMapping("/issues/{id}")
    @Operation(summary = "Get issue details by ID", description = "Retrieves issue metadata, comments, and recent occurrence trace details")
    public ResponseEntity<IssueResponse> getIssueById(@PathVariable UUID id) {
        return ResponseEntity.ok(issueService.getIssueById(id));
    }

    @PutMapping("/issues/{id}/status")
    @Operation(summary = "Update issue triage status", description = "Transitions issue status (e.g., from UNRESOLVED to RESOLVED)")
    public ResponseEntity<IssueResponse> updateIssueStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request
    ) {
        return ResponseEntity.ok(issueService.updateIssueStatus(id, request.status()));
    }

    @PutMapping("/issues/{id}/assign")
    @Operation(summary = "Assign issue to developer", description = "Assigns responsibility for resolving a specific crash signature")
    public ResponseEntity<IssueResponse> assignIssue(
            @PathVariable UUID id,
            @RequestBody AssignIssueRequest request
    ) {
        return ResponseEntity.ok(issueService.assignIssue(id, request.userId()));
    }

    @PostMapping("/issues/{id}/comments")
    @Operation(summary = "Add comment to issue", description = "Appends a new collaborative troubleshooting note to the thread")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CommentRequest request
    ) {
        return ResponseEntity.ok(issueService.addComment(id, user.getId(), request.content()));
    }

    @GetMapping("/issues/{id}/comments")
    @Operation(summary = "Get comments list", description = "Retrieves comment timeline history for an issue")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable UUID id) {
        return ResponseEntity.ok(issueService.getComments(id));
    }

    @GetMapping("/issues/{id}/events")
    @Operation(summary = "Get Elasticsearch logs list", description = "Queries raw occurrence documents mapped to this exception")
    public ResponseEntity<List<EventLog>> getIssueEvents(@PathVariable UUID id) {
        return ResponseEntity.ok(issueService.getIssueEvents(id));
    }
}
