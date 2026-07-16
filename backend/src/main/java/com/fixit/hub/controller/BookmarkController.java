package com.fixit.hub.controller;

import com.fixit.hub.domain.entity.Bookmark;
import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.domain.entity.User;
import com.fixit.hub.repository.jpa.BookmarkRepository;
import com.fixit.hub.repository.jpa.IssueRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Bookmarks", description = "Endpoints for managing user bookmarked errors")
public class BookmarkController {

    private final BookmarkRepository bookmarkRepository;
    private final IssueRepository issueRepository;

    @PostMapping("/{issueId}")
    @Operation(summary = "Bookmark an issue")
    public ResponseEntity<Void> bookmarkIssue(
            @PathVariable UUID issueId,
            @AuthenticationPrincipal User user
    ) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        if (!bookmarkRepository.existsByUserAndIssue(user, issue)) {
            bookmarkRepository.save(Bookmark.builder().user(user).issue(issue).build());
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{issueId}")
    @Operation(summary = "Remove bookmark from an issue")
    public ResponseEntity<Void> unbookmarkIssue(
            @PathVariable UUID issueId,
            @AuthenticationPrincipal User user
    ) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new IllegalArgumentException("Issue not found"));
        bookmarkRepository.findByUserAndIssue(user, issue)
                .ifPresent(bookmarkRepository::delete);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @Operation(summary = "List all bookmarked issue IDs")
    public ResponseEntity<List<String>> getBookmarkedIssueIds(@AuthenticationPrincipal User user) {
        List<String> ids = bookmarkRepository.findByUser(user).stream()
                .map(b -> b.getIssue().getId().toString())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ids);
    }
}
