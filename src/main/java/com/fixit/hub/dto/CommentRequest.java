package com.fixit.hub.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
    @NotBlank(message = "Comment content is required")
    String content
) {}
