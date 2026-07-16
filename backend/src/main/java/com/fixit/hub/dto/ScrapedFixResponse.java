package com.fixit.hub.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ScrapedFixResponse(
    UUID id,
    String sourceName,
    String sourceUrl,
    String title,
    String content,
    LocalDateTime createdAt
) {}
