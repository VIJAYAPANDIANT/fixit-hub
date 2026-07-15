package com.fixit.hub.dto;

import java.util.List;

public record IssueSearchResponse(
    List<IssueResponse> issues,
    List<String> suggestions,
    List<String> autocomplete
) {}
