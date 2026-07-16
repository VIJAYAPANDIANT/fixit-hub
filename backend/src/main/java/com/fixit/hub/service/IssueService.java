package com.fixit.hub.service;

import com.fixit.hub.domain.document.EventLog;
import com.fixit.hub.domain.entity.IssueDifficulty;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;
import com.fixit.hub.dto.CommentResponse;
import com.fixit.hub.dto.ErrorRequest;
import com.fixit.hub.dto.IssueResponse;

import java.util.List;
import java.util.UUID;

public interface IssueService {
    IssueResponse createError(ErrorRequest request);
    IssueResponse updateError(UUID id, ErrorRequest request);
    void deleteError(UUID id);
    
    List<IssueResponse> getFilteredIssues(
            UUID projectId,
            IssueStatus status,
            IssueSeverity severity,
            IssueDifficulty difficulty,
            String search,
            String sortBy
    );
    
    IssueResponse getIssueById(UUID id); // Fetches details and increments views count
    IssueResponse updateIssueStatus(UUID id, IssueStatus status);
    IssueResponse assignIssue(UUID id, UUID userId);
    CommentResponse addComment(UUID id, UUID userId, String content);
    List<CommentResponse> getComments(UUID id);
    List<EventLog> getIssueEvents(UUID id);
}
