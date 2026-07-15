package com.fixit.hub.repository.jpa;

import com.fixit.hub.domain.entity.Solution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SolutionRepository extends JpaRepository<Solution, UUID> {
    List<Solution> findByIssueId(UUID issueId);
    boolean existsByIssueIdAndIsAcceptedTrue(UUID issueId);
}
