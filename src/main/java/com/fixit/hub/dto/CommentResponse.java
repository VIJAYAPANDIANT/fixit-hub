package com.fixit.hub.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CommentResponse(
    UUID id,
    UUID issueId,
    UUID userId,
    String userName,
    String content,
    LocalDateTime createdAt
) {}
