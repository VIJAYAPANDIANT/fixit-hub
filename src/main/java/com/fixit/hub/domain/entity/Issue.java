package com.fixit.hub.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "errors",
    uniqueConstraints = {@UniqueConstraint(columnNames = {"project_id", "fingerprint"})}
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Issue {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String fingerprint;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(columnDefinition = "TEXT")
    private String stacktrace;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "verified_fix", columnDefinition = "TEXT")
    private String verifiedFix;

    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private String codeSnippet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueDifficulty difficulty;

    @Column(nullable = false)
    private int popularity;

    @Column(nullable = false)
    private int views;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Column(name = "first_seen", nullable = false)
    private LocalDateTime firstSeen;

    @Column(name = "last_seen", nullable = false)
    private LocalDateTime lastSeen;

    @Column(name = "occurrences_count", nullable = false)
    private int occurrencesCount;

    @Column(name = "ai_analysis", columnDefinition = "TEXT")
    private String aiAnalysis; // JSON string payload mapping AI diagnostics

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
}
