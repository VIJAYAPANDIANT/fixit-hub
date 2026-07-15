package com.fixit.hub.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_solutions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AISolution {
    
    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "error_id", nullable = false, unique = true)
    private Issue issue;

    @Column(name = "model_name", nullable = false)
    private String modelName;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String summary;

    @Column(name = "root_cause", columnDefinition = "TEXT", nullable = false)
    private String rootCause;

    @Column(name = "fix_suggestion", columnDefinition = "TEXT", nullable = false)
    private String fixSuggestion;

    @Column(name = "confidence_score", nullable = false)
    private double confidenceScore;

    @Column(name = "title", columnDefinition = "TEXT")
    private String title;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "fix_steps", columnDefinition = "TEXT")
    private String fixSteps;

    @Column(name = "improved_code", columnDefinition = "TEXT")
    private String improvedCode;

    @Column(name = "best_practices", columnDefinition = "TEXT")
    private String bestPractices;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = LocalDateTime.now();
    }
}
