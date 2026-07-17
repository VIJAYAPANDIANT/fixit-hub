package com.fixit.hub.repository.jpa;

import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.domain.entity.IssueDifficulty;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IssueRepository extends JpaRepository<Issue, UUID> {
    
    Optional<Issue> findByProjectIdAndFingerprint(UUID projectId, String fingerprint);

    @Query("SELECT DISTINCT i FROM Issue i " +
           "LEFT JOIN FETCH i.project " +
           "LEFT JOIN FETCH i.language " +
           "LEFT JOIN FETCH i.framework " +
           "LEFT JOIN FETCH i.category " +
           "LEFT JOIN FETCH i.assignedTo " +
           "WHERE i.project.id = :projectId " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:severity IS NULL OR i.severity = :severity) " +
           "AND (:difficulty IS NULL OR i.difficulty = :difficulty) " +
           "AND (:search IS NULL OR LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(i.message) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Issue> findFilteredIssues(
            @Param("projectId") UUID projectId,
            @Param("status") IssueStatus status,
            @Param("severity") IssueSeverity severity,
            @Param("difficulty") IssueDifficulty difficulty,
            @Param("search") String search,
            Sort sort
    );
}
