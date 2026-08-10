package com.fixit.hub.controller;

import com.fixit.hub.dto.WebhookRequest;
import com.fixit.hub.dto.WebhookResponse;
import com.fixit.hub.service.WebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/webhooks")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Webhooks", description = "Endpoints for managing real-time Slack/Discord alert webhooks")
public class WebhookController {

    private final WebhookService webhookService;

    @GetMapping
    @Operation(summary = "List all webhooks for a project")
    public ResponseEntity<List<WebhookResponse>> getProjectWebhooks(@PathVariable UUID projectId) {
        return ResponseEntity.ok(webhookService.getProjectWebhooks(projectId));
    }

    @PostMapping
    @Operation(summary = "Register a new webhook")
    public ResponseEntity<WebhookResponse> createWebhook(
            @PathVariable UUID projectId,
            @Valid @RequestBody WebhookRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(webhookService.createWebhook(projectId, request));
    }

    @PutMapping("/{webhookId}")
    @Operation(summary = "Update an existing webhook configuration")
    public ResponseEntity<WebhookResponse> updateWebhook(
            @PathVariable UUID projectId,
            @PathVariable UUID webhookId,
            @Valid @RequestBody WebhookRequest request
    ) {
        return ResponseEntity.ok(webhookService.updateWebhook(webhookId, request));
    }

    @DeleteMapping("/{webhookId}")
    @Operation(summary = "Delete a webhook definition")
    public ResponseEntity<Map<String, String>> deleteWebhook(
            @PathVariable UUID projectId,
            @PathVariable UUID webhookId
    ) {
        webhookService.deleteWebhook(webhookId);
        return ResponseEntity.ok(Map.of("message", "Webhook deleted successfully."));
    }

    @PostMapping("/{webhookId}/test")
    @Operation(summary = "Test sending a connection check ping to the webhook URL")
    public ResponseEntity<Map<String, String>> testWebhook(
            @PathVariable UUID projectId,
            @PathVariable UUID webhookId
    ) {
        webhookService.testWebhook(webhookId);
        return ResponseEntity.ok(Map.of("message", "Test webhook request dispatched successfully."));
    }
}
