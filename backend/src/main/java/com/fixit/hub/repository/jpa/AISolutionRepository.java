package com.fixit.hub.repository.jpa;

import com.fixit.hub.domain.entity.AISolution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AISolutionRepository extends JpaRepository<AISolution, UUID> {
    Optional<AISolution> findByIssueId(UUID issueId);
}
