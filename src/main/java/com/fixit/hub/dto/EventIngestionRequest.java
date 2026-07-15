package com.fixit.hub.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record EventIngestionRequest(
    @NotBlank(message = "Exception type is required")
    String exceptionType,

    @NotBlank(message = "Exception message is required")
    String exceptionMessage,

    @NotBlank(message = "Stacktrace is required")
    String stacktrace,

    String environment,
    String release,
    String breadcrumbs,
    Map<String, String> tags,
    Map<String, String> userContext,
    String fingerprint
) {}
