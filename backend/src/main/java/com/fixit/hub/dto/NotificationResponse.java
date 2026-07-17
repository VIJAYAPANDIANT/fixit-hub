package com.fixit.hub.dto;

import java.util.UUID;

public record NotificationResponse(
    UUID id,
    String type,
    String title,
    String message,
    boolean isRead,
    String createdAt
) {}
