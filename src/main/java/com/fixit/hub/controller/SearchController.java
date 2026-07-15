package com.fixit.hub.controller;

import com.fixit.hub.domain.entity.IssueDifficulty;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;
import com.fixit.hub.dto.IssueSearchResponse;
import com.fixit.hub.service.IssueSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Advanced Search", description = "Endpoints for Elasticsearch-based full-text searching, autocomplete, typo correction, and search suggestions")
public class SearchController {

    private final IssueSearchService issueSearchService;

    @GetMapping
    @Operation(summary = "Advanced error search", description = "Queries full-text error title/message/stacktrace/description via Elasticsearch. Supports spelling corrections, autocomplete, ranking based on popularity and date.")
    public ResponseEntity<IssueSearchResponse> search(
            @RequestParam UUID projectId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) IssueStatus status,
            @RequestParam(required = false) IssueSeverity severity,
            @RequestParam(required = false) IssueDifficulty difficulty,
            @RequestParam(required = false) String language,
            @RequestParam(required = false) String framework,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false, defaultValue = "relevance") String sortBy
    ) {
        IssueSearchResponse searchResponse = issueSearchService.searchIssues(
                projectId, query, status, severity, difficulty, language, framework, category, tags, sortBy);
        return ResponseEntity.ok(searchResponse);
    }
}
