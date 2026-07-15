package com.fixit.hub.service.ai;

import com.fixit.hub.domain.entity.Issue;

public interface AIDiagnosticService {
    void diagnoseIssueAsync(Issue issue, String exceptionType, String exceptionMessage, String stacktrace);
}
