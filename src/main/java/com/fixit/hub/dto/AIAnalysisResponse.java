package com.fixit.hub.dto;

public record AIAnalysisResponse(
    String title,
    String explanation,
    String rootCause,
    String fixSteps,
    String improvedCode,
    String bestPractices,
    double confidenceScore
) {}
