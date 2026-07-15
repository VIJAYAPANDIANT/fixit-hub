package com.fixit.hub.repository.jpa;

import com.fixit.hub.domain.entity.ProgrammingLanguage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProgrammingLanguageRepository extends JpaRepository<ProgrammingLanguage, Integer> {
    Optional<ProgrammingLanguage> findBySlug(String slug);
}
