package com.fixit.hub.controller;

import com.fixit.hub.domain.entity.User;
import com.fixit.hub.service.BookmarkService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Bookmarks", description = "Endpoints for managing user bookmarked errors")
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @PostMapping("/{issueId}")
    @Operation(summary = "Bookmark an issue")
    public ResponseEntity<Void> bookmarkIssue(
            @PathVariable UUID issueId,
            @AuthenticationPrincipal User user
    ) {
        bookmarkService.bookmarkIssue(issueId, user);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{issueId}")
    @Operation(summary = "Remove bookmark from an issue")
    public ResponseEntity<Void> unbookmarkIssue(
            @PathVariable UUID issueId,
            @AuthenticationPrincipal User user
    ) {
        bookmarkService.unbookmarkIssue(issueId, user);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @Operation(summary = "List all bookmarked issue IDs")
    public ResponseEntity<List<String>> getBookmarkedIssueIds(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookmarkService.getBookmarkedIssueIds(user));
    }
}
