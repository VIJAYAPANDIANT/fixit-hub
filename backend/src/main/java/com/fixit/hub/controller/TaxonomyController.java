package com.fixit.hub.controller;

import com.fixit.hub.repository.jpa.CategoryRepository;
import com.fixit.hub.repository.jpa.FrameworkRepository;
import com.fixit.hub.repository.jpa.ProgrammingLanguageRepository;
import com.fixit.hub.repository.jpa.TagRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/taxonomy")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Taxonomy Lookup", description = "Endpoints for fetching programming languages, frameworks, categories, and tags")
public class TaxonomyController {

    private final ProgrammingLanguageRepository languageRepository;
    private final FrameworkRepository frameworkRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;

    public record TaxonomyItem(Integer id, String name, String slug) {}

    @GetMapping("/languages")
    @Operation(summary = "Get list of programming languages")
    public ResponseEntity<List<TaxonomyItem>> getLanguages() {
        return ResponseEntity.ok(languageRepository.findAll().stream()
                .map(l -> new TaxonomyItem(l.getId(), l.getName(), l.getSlug()))
                .collect(Collectors.toList()));
    }

    @GetMapping("/frameworks")
    @Operation(summary = "Get list of frameworks")
    public ResponseEntity<List<TaxonomyItem>> getFrameworks() {
        return ResponseEntity.ok(frameworkRepository.findAll().stream()
                .map(f -> new TaxonomyItem(f.getId(), f.getName(), f.getSlug()))
                .collect(Collectors.toList()));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get list of categories")
    public ResponseEntity<List<TaxonomyItem>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAll().stream()
                .map(c -> new TaxonomyItem(c.getId(), c.getName(), c.getSlug()))
                .collect(Collectors.toList()));
    }

    @GetMapping("/tags")
    @Operation(summary = "Get list of tags")
    public ResponseEntity<List<TaxonomyItem>> getTags() {
        return ResponseEntity.ok(tagRepository.findAll().stream()
                .map(t -> new TaxonomyItem(t.getId(), t.getName(), t.getSlug()))
                .collect(Collectors.toList()));
    }
}
