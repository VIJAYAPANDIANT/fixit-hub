package com.fixit.hub.dto;

import java.util.UUID;

public record WebhookResponse(
    UUID id,
    UUID projectId,
    String name,
    String url,
    String type,
    boolean active,
    String createdAt
) {}
