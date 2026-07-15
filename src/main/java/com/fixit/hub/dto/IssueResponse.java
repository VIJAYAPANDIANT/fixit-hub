package com.fixit.hub.dto;

import com.fixit.hub.domain.entity.IssueDifficulty;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record IssueResponse(
    UUID id,
    UUID projectId,
    String fingerprint,
    String title,
    String message,
    String description,
    String rootCause,
    String verifiedFix,
    String codeSnippet,
    IssueStatus status,
    IssueSeverity severity,
    IssueDifficulty difficulty,
    int popularity,
    int views,
    UUID assignedToUserId,
    String assignedToName,
    LocalDateTime firstSeen,
    LocalDateTime lastSeen,
    int occurrencesCount,
    String aiAnalysis,
    String languageName,
    String languageSlug,
    String frameworkName,
    String frameworkSlug,
    String categoryName,
    String categorySlug,
    java.util.List<String> tags
) {}
