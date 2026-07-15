package com.fixit.hub.repository.jpa;

import com.fixit.hub.domain.entity.Framework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface FrameworkRepository extends JpaRepository<Framework, Integer> {
    Optional<Framework> findBySlug(String slug);
}
