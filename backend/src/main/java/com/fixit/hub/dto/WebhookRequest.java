package com.fixit.hub.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record WebhookRequest(
    @NotBlank(message = "Name is required")
    @Size(max = 255)
    String name,

    @NotBlank(message = "URL is required")
    @Size(max = 500)
    @Pattern(regexp = "^https?://.*$", message = "URL must start with http:// or https://")
    String url,

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "^(SLACK|DISCORD)$", message = "Type must be either SLACK or DISCORD")
    String type,

    Boolean active
) {}
