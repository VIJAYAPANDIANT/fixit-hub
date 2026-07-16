package com.fixit.hub.service;

import com.fixit.hub.dto.ScrapedFixResponse;
import java.util.List;
import java.util.UUID;

public interface ScraperService {
    List<ScrapedFixResponse> getScrapedFixes(UUID issueId);
    void scrapeExternalFixesForActiveIssues();
}
