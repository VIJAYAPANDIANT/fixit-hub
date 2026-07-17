package com.fixit.hub.repository.jpa;

import com.fixit.hub.domain.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Comment c LEFT JOIN FETCH c.user WHERE c.issue.id = :issueId ORDER BY c.createdAt ASC")
    List<Comment> findByIssueIdOrderByCreatedAtAsc(@org.springframework.data.repository.query.Param("issueId") UUID issueId);
}
