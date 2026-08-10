package com.fixit.hub.repository.jpa;

import com.fixit.hub.domain.entity.Webhook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WebhookRepository extends JpaRepository<Webhook, UUID> {
    List<Webhook> findByProjectId(UUID projectId);
    List<Webhook> findByProjectIdAndActiveTrue(UUID projectId);
}
