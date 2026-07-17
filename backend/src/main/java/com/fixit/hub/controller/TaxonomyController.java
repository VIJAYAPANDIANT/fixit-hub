package com.fixit.hub.controller;

import com.fixit.hub.dto.TaxonomyResponse;
import com.fixit.hub.service.TaxonomyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/taxonomy")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Taxonomy Lookup", description = "Endpoints for fetching programming languages, frameworks, categories, and tags")
public class TaxonomyController {

    private final TaxonomyService taxonomyService;

    @GetMapping("/languages")
    @Operation(summary = "Get list of programming languages")
    public ResponseEntity<List<TaxonomyResponse>> getLanguages() {
        return ResponseEntity.ok(taxonomyService.getLanguages());
    }

    @GetMapping("/frameworks")
    @Operation(summary = "Get list of frameworks")
    public ResponseEntity<List<TaxonomyResponse>> getFrameworks() {
        return ResponseEntity.ok(taxonomyService.getFrameworks());
    }

    @GetMapping("/categories")
    @Operation(summary = "Get list of categories")
    public ResponseEntity<List<TaxonomyResponse>> getCategories() {
        return ResponseEntity.ok(taxonomyService.getCategories());
    }

    @GetMapping("/tags")
    @Operation(summary = "Get list of tags")
    public ResponseEntity<List<TaxonomyResponse>> getTags() {
        return ResponseEntity.ok(taxonomyService.getTags());
    }
}
