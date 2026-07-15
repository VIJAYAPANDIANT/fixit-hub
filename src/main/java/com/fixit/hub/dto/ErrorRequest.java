package com.fixit.hub.dto;

import com.fixit.hub.domain.entity.IssueDifficulty;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ErrorRequest(
    @NotNull(message = "Project ID is required")
    UUID projectId,

    @NotBlank(message = "Title is required")
    String title,

    String description,
    String message,
    String stacktrace,
    String rootCause,
    String verifiedFix,
    String codeSnippet,

    @NotNull(message = "Status is required")
    IssueStatus status,

    @NotNull(message = "Severity is required")
    IssueSeverity severity,

    @NotNull(message = "Difficulty is required")
    IssueDifficulty difficulty,

    Integer languageId,
    Integer frameworkId,
    Integer categoryId,
    java.util.List<Integer> tagIds
) {}
