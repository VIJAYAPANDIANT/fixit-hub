package com.fixit.hub.service;

import com.fixit.hub.domain.entity.IssueDifficulty;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;
import com.fixit.hub.dto.IssueSearchResponse;

import java.util.List;
import java.util.UUID;

public interface IssueSearchService {
    
    IssueSearchResponse searchIssues(
            UUID projectId,
            String query,
            IssueStatus status,
            IssueSeverity severity,
            IssueDifficulty difficulty,
            String language,
            String framework,
            String category,
            List<String> tags,
            String sortBy
    );
}
