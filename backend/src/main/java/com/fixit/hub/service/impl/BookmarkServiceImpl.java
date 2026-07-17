package com.fixit.hub.service.impl;

import com.fixit.hub.domain.entity.Bookmark;
import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.domain.entity.User;
import com.fixit.hub.exception.ResourceNotFoundException;
import com.fixit.hub.repository.jpa.BookmarkRepository;
import com.fixit.hub.repository.jpa.IssueRepository;
import com.fixit.hub.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookmarkServiceImpl implements BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final IssueRepository issueRepository;

    @Override
    @Transactional
    public void bookmarkIssue(UUID issueId, User user) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with ID: " + issueId));
        if (!bookmarkRepository.existsByUserAndIssue(user, issue)) {
            bookmarkRepository.save(Bookmark.builder().user(user).issue(issue).build());
        }
    }

    @Override
    @Transactional
    public void unbookmarkIssue(UUID issueId, User user) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with ID: " + issueId));
        bookmarkRepository.findByUserAndIssue(user, issue)
                .ifPresent(bookmarkRepository::delete);
    }

    @Override
    public List<String> getBookmarkedIssueIds(User user) {
        return bookmarkRepository.findBookmarkedIssueIdsByUser(user).stream()
                .map(UUID::toString)
                .collect(Collectors.toList());
    }
}
