package com.fixit.hub.service;

import com.fixit.hub.dto.AIAnalysisResponse;
import java.util.UUID;

public interface AIService {
    AIAnalysisResponse getAIDiagnosis(UUID issueId, String additionalContext);
}
