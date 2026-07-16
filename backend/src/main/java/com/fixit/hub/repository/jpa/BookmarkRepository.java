package com.fixit.hub.repository.jpa;

import com.fixit.hub.domain.entity.Bookmark;
import com.fixit.hub.domain.entity.User;
import com.fixit.hub.domain.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, UUID> {
    List<Bookmark> findByUser(User user);
    Optional<Bookmark> findByUserAndIssue(User user, Issue issue);
    boolean existsByUserAndIssue(User user, Issue issue);
}
