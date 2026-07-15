package com.fixit.hub.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.repository.jpa.IssueRepository;
import com.fixit.hub.service.ai.AIDiagnosticService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIDiagnosticServiceImpl implements AIDiagnosticService {

    private final IssueRepository issueRepository;
    private final ObjectMapper objectMapper;
    private final com.fixit.hub.repository.es.IssueDocumentRepository issueDocumentRepository;
    private final com.fixit.hub.mapper.IssueMapper issueMapper;

    @Value("${integrations.gemini.api-key}")
    private String apiKey;

    @Value("${integrations.gemini.model}")
    private String modelName;

    @Override
    @Async
    @Transactional
    public void diagnoseIssueAsync(Issue issue, String exceptionType, String exceptionMessage, String stacktrace) {
        log.info("Triggering async AI diagnosis for issue ID: {}", issue.getId());
        
        String summary = "";
        String rootCause = "";
        String fixSuggestion = "";

        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String promptText = String.format("""
                        You are a senior debugger. Analyze the following error and stack trace.
                        Exception: %s
                        Message: %s
                        Stacktrace:
                        %s
                        
                        Provide a structured analysis in valid JSON format ONLY. Do not wrap in markdown code blocks. Return exactly this JSON structure:
                        {
                          "summary": "Brief summary of the issue",
                          "root_cause": "The root cause hypothesis explaining why this crash happens",
                          "fix_suggestion": "Step-by-step resolution proposal with example code"
                        }
                        """, exceptionType, exceptionMessage, stacktrace);

                HttpClient client = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(10))
                        .build();

                // Build Request Payload
                ObjectNode requestRoot = objectMapper.createObjectNode();
                var contents = requestRoot.putArray("contents");
                var contentObj = contents.addObject();
                var parts = contentObj.putArray("parts");
                var partObj = parts.addObject();
                partObj.put("text", promptText);

                String requestBody = objectMapper.writeValueAsString(requestRoot);
                String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", 
                        modelName, apiKey);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                        .timeout(Duration.ofSeconds(20))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode responseRoot = objectMapper.readTree(response.body());
                    String responseText = responseRoot
                            .path("candidates").get(0)
                            .path("content").path("parts").get(0)
                            .path("text").asText().trim();

                    // Remove markdown backticks if Gemini ignored instructions
                    String cleanJson = responseText
                            .replaceAll("^```json\\s*", "")
                            .replaceAll("```$", "")
                            .trim();

                    JsonNode analysisJson = objectMapper.readTree(cleanJson);
                    summary = analysisJson.path("summary").asText("AI analysis summary unparseable.");
                    rootCause = analysisJson.path("root_cause").asText("AI analysis root cause unparseable.");
                    fixSuggestion = analysisJson.path("fix_suggestion").asText("AI analysis fix suggestion unparseable.");
                } else {
                    log.warn("Gemini API call failed with status: {}. Falling back to heuristics.", response.statusCode());
                    var fallback = generateLocalDiagnostics(exceptionType, exceptionMessage);
                    summary = fallback.get("summary");
                    rootCause = fallback.get("rootCause");
                    fixSuggestion = fallback.get("fixSuggestion");
                }
            } catch (Exception e) {
                log.error("Error communicating with Gemini API, activating offline diagnostics:", e);
                var fallback = generateLocalDiagnostics(exceptionType, exceptionMessage);
                summary = fallback.get("summary");
                rootCause = fallback.get("rootCause");
                fixSuggestion = fallback.get("fixSuggestion");
            }
        } else {
            log.info("GEMINI_API_KEY is not configured. Falling back to offline heuristics.");
            var fallback = generateLocalDiagnostics(exceptionType, exceptionMessage);
            summary = fallback.get("summary");
            rootCause = fallback.get("rootCause");
            fixSuggestion = fallback.get("fixSuggestion");
        }

        try {
            // Write analysis back to database
            ObjectNode analysisPayload = objectMapper.createObjectNode();
            analysisPayload.put("summary", summary);
            analysisPayload.put("root_cause", rootCause);
            analysisPayload.put("fix_suggestion", fixSuggestion);
            analysisPayload.put("analyzed_at", LocalDateTime.now().toString());

            String jsonPayload = objectMapper.writeValueAsString(analysisPayload);
            
            // Re-fetch to prevent lazy loading issues in async context
            Issue persistentIssue = issueRepository.findById(issue.getId()).orElse(null);
            if (persistentIssue != null) {
                persistentIssue.setAiAnalysis(jsonPayload);
                issueRepository.save(persistentIssue);
                try {
                    issueDocumentRepository.save(issueMapper.toDocument(persistentIssue));
                } catch (Exception esEx) {
                    log.error("Failed to sync AI analysis to Elasticsearch: {}", esEx.getMessage());
                }
                log.info("AI Analysis successfully generated and saved for issue: {}", issue.getId());
            }
        } catch (Exception e) {
            log.error("Failed to serialize and save AI diagnostics payload", e);
        }
    }

    private Map<String, String> generateLocalDiagnostics(String type, String message) {
        Map<String, String> map = new HashMap<>();
        String normalized = (type + " " + message).toLowerCase();

        map.put("summary", "Heuristic offline analysis of " + type);
        
        if (normalized.contains("null") || normalized.contains("undefined")) {
            map.put("rootCause", "A property access or method invocation was attempted on a null or uninitialized reference.");
            map.put("fixSuggestion", "Verify the instance is populated before reading fields:\n\n```java\nif (target != null) {\n    target.performAction();\n} else {\n    // Log warning or handle alternative route\n}\n```");
        } else if (normalized.contains("auth") || normalized.contains("jwt") || normalized.contains("token")) {
            map.put("rootCause", "Request authentication failed due to an empty, malformed, or expired secure signature.");
            map.put("fixSuggestion", "Verify client credentials match the target server, check expiration claims, and ensure keys are parsed as Base64.");
        } else if (normalized.contains("database") || normalized.contains("sql") || normalized.contains("connection")) {
            map.put("rootCause", "A backend transaction timed out or was rejected due to lock contention or database pool resource exhaustion.");
            map.put("fixSuggestion", "Review database thread limits, optimize indexing, and confirm connections are released properly back into pools.");
        } else {
            map.put("rootCause", "Check the exact line bounds listed in the stack trace logs for bounds details.");
            map.put("fixSuggestion", "Audit input sanitization boundaries, add a try-catch handler block, and verify network connectivity settings.");
        }

        return map;
    }
}
