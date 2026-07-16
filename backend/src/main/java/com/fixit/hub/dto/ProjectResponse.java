package com.fixit.hub.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectResponse(
    UUID id,
    String name,
    String dsnKey,
    LocalDateTime createdAt
) {}
