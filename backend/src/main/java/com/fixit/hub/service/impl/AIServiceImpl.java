package com.fixit.hub.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fixit.hub.domain.entity.AISolution;
import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.dto.AIAnalysisResponse;
import com.fixit.hub.exception.BadRequestException;
import com.fixit.hub.exception.ResourceNotFoundException;
import com.fixit.hub.repository.jpa.AISolutionRepository;
import com.fixit.hub.repository.jpa.IssueRepository;
import com.fixit.hub.repository.jpa.SolutionRepository;
import com.fixit.hub.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIServiceImpl implements AIService {

    private final IssueRepository issueRepository;
    private final SolutionRepository solutionRepository;
    private final AISolutionRepository aiSolutionRepository;
    private final ObjectMapper objectMapper;

    @Value("${integrations.gemini.api-key}")
    private String apiKey;

    @Value("${integrations.gemini.model}")
    private String modelName;

    @Override
    @Transactional
    @Cacheable(value = "aiAnalysis", key = "#issueId")
    public AIAnalysisResponse getAIDiagnosis(UUID issueId, String additionalContext) {
        log.info("Requesting AI diagnosis for issue ID: {} with context: {}", issueId, additionalContext);

        // 1. Check if a verified fix (accepted human solution) exists
        boolean hasVerifiedFix = solutionRepository.existsByIssueIdAndIsAcceptedTrue(issueId);
        if (hasVerifiedFix) {
            log.warn("A verified solution already exists for issue: {}. Bypassing AI call.", issueId);
            throw new BadRequestException("A verified solution already exists for this issue. AI diagnosis is bypassed.");
        }

        // 2. Fetch the Issue
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with ID: " + issueId));

        // 3. Check if we already have a detailed persistent AI solution in the database
        Optional<AISolution> existingAiSolution = aiSolutionRepository.findByIssueId(issueId);
        if (existingAiSolution.isPresent() && existingAiSolution.get().getExplanation() != null) {
            log.info("Found existing detailed AI suggestion in database for issue: {}", issueId);
            AISolution solution = existingAiSolution.get();
            return new AIAnalysisResponse(
                    solution.getTitle(),
                    solution.getExplanation(),
                    solution.getRootCause(),
                    solution.getFixSteps(),
                    solution.getImprovedCode(),
                    solution.getBestPractices(),
                    solution.getConfidenceScore()
            );
        }

        // 4. Invoke Gemini API if no verified fix and no stored diagnostic exists
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY is not configured. Falling back to static heuristic diagnostics.");
            AIAnalysisResponse fallback = generateFallbackDiagnostics(issue);
            saveAISolution(issue, fallback);
            return fallback;
        }

        try {
            String language = issue.getLanguage() != null ? issue.getLanguage().getName() : "Unknown";
            String framework = issue.getFramework() != null ? issue.getFramework().getName() : "Unknown";
            String context = additionalContext != null ? additionalContext : "None provided";

            String prompt = String.format("""
                    You are an expert debugger. Analyze the following application crash details:
                    Programming Language: %s
                    Framework: %s
                    Error Message: %s
                    
                    Stack Trace:
                    %s
                    
                    Additional Context:
                    %s
                    
                    Provide a detailed resolution guide in valid JSON format ONLY. Do not wrap in markdown code blocks. Return exactly this JSON structure:
                    {
                      "title": "A concise title summarizing the error fix",
                      "explanation": "A clear explanation of the error",
                      "root_cause": "The detailed root cause explanation of the issue",
                      "fix_steps": "Step-by-step instructions on how to resolve the issue",
                      "improved_code": "An example of the corrected/improved code snippet",
                      "best_practices": "Coding standards and best practices to prevent this error in the future",
                      "confidence_score": 0.95
                    }
                    """, language, framework, issue.getMessage(), issue.getStacktrace(), context);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            ObjectNode requestRoot = objectMapper.createObjectNode();
            var contents = requestRoot.putArray("contents");
            var contentObj = contents.addObject();
            var parts = contentObj.putArray("parts");
            var partObj = parts.addObject();
            partObj.put("text", prompt);

            String requestBody = objectMapper.writeValueAsString(requestRoot);
            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    modelName, apiKey);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(20))
                    .build();

            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode responseRoot = objectMapper.readTree(response.body());
                String responseText = responseRoot
                        .path("candidates").get(0)
                        .path("content").path("parts").get(0)
                        .path("text").asText().trim();

                // Clean markdown wrappers if Gemini ignored instructions
                String cleanJson = responseText
                        .replaceAll("^```json\\s*", "")
                        .replaceAll("```$", "")
                        .trim();

                JsonNode resultNode = objectMapper.readTree(cleanJson);

                AIAnalysisResponse aiResponse = new AIAnalysisResponse(
                        resultNode.path("title").asText("AI Analysis Suggestion"),
                        resultNode.path("explanation").asText("No explanation provided."),
                        resultNode.path("root_cause").asText("No root cause analyzed."),
                        resultNode.path("fix_steps").asText("No fix steps suggested."),
                        resultNode.path("improved_code").asText(""),
                        resultNode.path("best_practices").asText("No best practices documented."),
                        resultNode.path("confidence_score").asDouble(0.5)
                );

                // Save to database
                saveAISolution(issue, aiResponse);
                return aiResponse;
            } else {
                log.warn("Gemini API request failed with code {}. Using fallback diagnostics.", response.statusCode());
                AIAnalysisResponse fallback = generateFallbackDiagnostics(issue);
                saveAISolution(issue, fallback);
                return fallback;
            }

        } catch (Exception e) {
            log.error("Failed to query Gemini API or deserialize diagnostics payload. Falling back: {}", e.getMessage(), e);
            AIAnalysisResponse fallback = generateFallbackDiagnostics(issue);
            saveAISolution(issue, fallback);
            return fallback;
        }
    }

    private void saveAISolution(Issue issue, AIAnalysisResponse response) {
        try {
            AISolution aiSolution = aiSolutionRepository.findByIssueId(issue.getId()).orElse(null);
            if (aiSolution == null) {
                aiSolution = new AISolution();
                aiSolution.setIssue(issue);
            }
            aiSolution.setModelName(modelName);
            aiSolution.setSummary(response.explanation());
            aiSolution.setRootCause(response.rootCause());
            aiSolution.setFixSuggestion(response.fixSteps());
            aiSolution.setConfidenceScore(response.confidenceScore());
            aiSolution.setTitle(response.title());
            aiSolution.setExplanation(response.explanation());
            aiSolution.setFixSteps(response.fixSteps());
            aiSolution.setImprovedCode(response.improvedCode());
            aiSolution.setBestPractices(response.bestPractices());

            aiSolutionRepository.save(aiSolution);
            log.info("Persisted extended AI solution details to database for issue: {}", issue.getId());
        } catch (Exception e) {
            log.error("Failed to persist AI solution metadata: {}", e.getMessage(), e);
        }
    }

    private AIAnalysisResponse generateFallbackDiagnostics(Issue issue) {
        String type = issue.getTitle();
        String message = issue.getMessage();
        String normalized = (type + " " + (message != null ? message : "")).toLowerCase();

        String explanation = "Standard offline system analysis matching " + type;
        String rootCause = "A general runtime exception occurred.";
        String fixSteps = "Inspect the stacktrace and verify references.";
        String improvedCode = "";
        String bestPractices = "Write unit tests and perform regression checks.";
        double confidence = 0.65;

        if (normalized.contains("nullpointer") || normalized.contains("null")) {
            rootCause = "A property access or method invocation was attempted on a null or uninitialized reference.";
            fixSteps = "1. Locate line causing NPE\n2. Add defensive null-check or Optional wrapper\n3. Verify parameter propagation paths.";
            improvedCode = "if (target != null) {\n    target.performAction();\n}";
            bestPractices = "Use Optionals where returning empty state is possible. Always run defensive null checks.";
        } else if (normalized.contains("oom") || normalized.contains("memory") || normalized.contains("heap")) {
            rootCause = "Memory limits were exceeded due to high heap allocation or memory leaks.";
            fixSteps = "1. Check heap settings\n2. Run a profiler to detect memory leaks\n3. Increase heap allocation sizes.";
            improvedCode = "export NODE_OPTIONS=\"--max-old-space-size=4096\"";
            bestPractices = "Clean up listeners. De-allocate references when no longer required.";
        }

        return new AIAnalysisResponse(
                "Offline Diagnostic: " + type,
                explanation,
                rootCause,
                fixSteps,
                improvedCode,
                bestPractices,
                confidence
        );
    }
}
