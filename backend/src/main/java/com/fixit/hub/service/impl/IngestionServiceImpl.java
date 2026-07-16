package com.fixit.hub.service.impl;

import com.fixit.hub.domain.document.EventLog;
import com.fixit.hub.domain.entity.*;
import com.fixit.hub.dto.EventIngestionRequest;
import com.fixit.hub.exception.BadRequestException;
import com.fixit.hub.exception.ResourceNotFoundException;
import com.fixit.hub.repository.es.EventLogRepository;
import com.fixit.hub.repository.jpa.IssueRepository;
import com.fixit.hub.repository.jpa.ProjectRepository;
import com.fixit.hub.service.IngestionService;
import com.fixit.hub.service.ai.AIDiagnosticService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class IngestionServiceImpl implements IngestionService {

    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;
    private final EventLogRepository eventLogRepository;
    private final AIDiagnosticService aiDiagnosticService;
    private final StringRedisTemplate redisTemplate;
    private final com.fixit.hub.repository.es.IssueDocumentRepository issueDocumentRepository;
    private final com.fixit.hub.mapper.IssueMapper issueMapper;
    private final com.fixit.hub.repository.jpa.ProgrammingLanguageRepository programmingLanguageRepository;
    private final com.fixit.hub.repository.jpa.FrameworkRepository frameworkRepository;
    private final com.fixit.hub.repository.jpa.CategoryRepository categoryRepository;
    private final com.fixit.hub.repository.jpa.TagRepository tagRepository;

    @Override
    @Transactional
    public void ingestEvent(String dsnKey, EventIngestionRequest request) {
        log.info("Ingesting event log for DSN Key: {}", dsnKey);

        // 1. Resolve Project DSN
        Project project = projectRepository.findByDsnKey(dsnKey)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid DSN Key. Project matching credentials not found."));

        // 2. Redis Rate Limiter Check (1000 EPS limit per minute)
        String limitKey = "ratelimit:project:" + project.getId();
        try {
            Long currentRequests = redisTemplate.opsForValue().increment(limitKey);
            if (currentRequests != null) {
                if (currentRequests == 1) {
                    redisTemplate.expire(limitKey, Duration.ofMinutes(1));
                }
                if (currentRequests > 1000) {
                    log.warn("Rate limit exceeded for project: {}. Ingestion blocked.", project.getId());
                    throw new BadRequestException("Rate limit exceeded (1000 requests/minute). Log rejected.");
                }
            }
        } catch (Exception e) {
            if (e instanceof BadRequestException) throw e;
            log.warn("Redis connectivity offline. Skipping rate limit checks: {}", e.getMessage());
        }

        // 3. Process Fingerprint & Aggregations
        String fingerprint = request.fingerprint();
        if (fingerprint == null || fingerprint.isBlank()) {
            // Deduplicate dynamically by hashing ExceptionType and Message
            String cleanTrace = request.exceptionType() + "|" + request.exceptionMessage() + "|" + request.stacktrace();
            fingerprint = DigestUtils.md5DigestAsHex(cleanTrace.getBytes(StandardCharsets.UTF_8));
        }

        // Generate a deterministic UUID matching the fingerprint
        UUID issueId = UUID.nameUUIDFromBytes(fingerprint.getBytes(StandardCharsets.UTF_8));
        LocalDateTime now = LocalDateTime.now();

        Issue issue = issueRepository.findById(issueId).orElse(null);
        boolean isNewIssue = false;

        if (issue == null) {
            isNewIssue = true;
            String cleanMessage = request.exceptionMessage() != null ? request.exceptionMessage() : "No message provided";
            String title = request.exceptionType() + ": " + cleanMessage.split("\n")[0];
            if (title.length() > 255) {
                title = title.substring(0, 252) + "...";
            }

            IssueSeverity severity = calculateHeuristicSeverity(request.exceptionType(), request.exceptionMessage());

            issue = Issue.builder()
                    .id(issueId)
                    .project(project)
                    .fingerprint(fingerprint)
                    .title(title)
                    .message(request.exceptionMessage())
                    .status(IssueStatus.UNRESOLVED)
                    .severity(severity)
                    .firstSeen(now)
                    .lastSeen(now)
                    .occurrencesCount(1)
                    .build();

            classifyIssueHeuristics(issue, request);
        } else {
            issue.setOccurrencesCount(issue.getOccurrencesCount() + 1);
            issue.setLastSeen(now);
            // Re-open issue if it was marked as RESOLVED
            if (issue.getStatus() == IssueStatus.RESOLVED) {
                issue.setStatus(IssueStatus.UNRESOLVED);
            }
        }

        issueRepository.save(issue);

        // Sync to Elasticsearch
        try {
            issueDocumentRepository.save(issueMapper.toDocument(issue));
        } catch (Exception e) {
            log.error("Failed to index issue in Elasticsearch: {}", e.getMessage());
        }

        // 4. Save Raw Event to Elasticsearch
        EventLog eventLog = EventLog.builder()
                .id(UUID.randomUUID().toString())
                .projectId(project.getId().toString())
                .issueId(issueId.toString())
                .timestamp(Instant.now())
                .environment(request.environment() != null ? request.environment() : "production")
                .release(request.release() != null ? request.release() : "unknown")
                .exceptionType(request.exceptionType())
                .exceptionMessage(request.exceptionMessage())
                .stacktrace(request.stacktrace())
                .breadcrumbs(request.breadcrumbs() != null ? request.breadcrumbs() : "[]")
                .tags(request.tags())
                .userContext(request.userContext())
                .fingerprint(fingerprint)
                .build();

        try {
            eventLogRepository.save(eventLog);
        } catch (Exception e) {
            log.error("Failed to index event log in Elasticsearch: {}", e.getMessage());
        }

        // 5. Trigger Async AI analysis if new issue
        if (isNewIssue) {
            aiDiagnosticService.diagnoseIssueAsync(
                    issue,
                    request.exceptionType(),
                    request.exceptionMessage(),
                    request.stacktrace()
            );
        }
    }

    private IssueSeverity calculateHeuristicSeverity(String type, String message) {
        String match = (type + " " + (message != null ? message : "")).toLowerCase();
        if (match.contains("critical") || match.contains("fatal") || match.contains("panic") || match.contains("out of memory")) {
            return IssueSeverity.CRITICAL;
        }
        if (match.contains("database") || match.contains("connection") || match.contains("auth") || match.contains("unauthorized")) {
            return IssueSeverity.HIGH;
        }
        if (match.contains("warn") || match.contains("deprecated")) {
            return IssueSeverity.LOW;
        }
        return IssueSeverity.MEDIUM;
    }

    private void classifyIssueHeuristics(Issue issue, EventIngestionRequest request) {
        String matchText = (request.exceptionType() + " " + 
                           (request.exceptionMessage() != null ? request.exceptionMessage() : "") + " " + 
                           (request.stacktrace() != null ? request.stacktrace() : "")).toLowerCase();

        // 1. Language & Framework
        ProgrammingLanguage lang = null;
        Framework framework = null;

        if (matchText.contains("java") || matchText.contains("spring")) {
            lang = programmingLanguageRepository.findBySlug("java").orElse(null);
            if (matchText.contains("spring")) {
                framework = frameworkRepository.findBySlug("spring-boot").orElse(null);
            }
        } else if (matchText.contains("django") || matchText.contains(".py")) {
            lang = programmingLanguageRepository.findBySlug("python").orElse(null);
            if (matchText.contains("django")) {
                framework = frameworkRepository.findBySlug("django").orElse(null);
            }
        } else if (matchText.contains("gin") || matchText.contains(".go")) {
            lang = programmingLanguageRepository.findBySlug("go").orElse(null);
            if (matchText.contains("gin")) {
                framework = frameworkRepository.findBySlug("gin").orElse(null);
            }
        } else if (matchText.contains("next") || matchText.contains("tsconfig")) {
            lang = programmingLanguageRepository.findBySlug("typescript").orElse(null);
            framework = frameworkRepository.findBySlug("nextjs").orElse(null);
        } else if (matchText.contains("express") || matchText.contains("node_modules")) {
            lang = programmingLanguageRepository.findBySlug("javascript").orElse(null);
            framework = frameworkRepository.findBySlug("express").orElse(null);
        }

        issue.setLanguage(lang);
        issue.setFramework(framework);

        // 2. Category
        Category category = null;
        if (matchText.contains("sql") || matchText.contains("database") || matchText.contains("connection pool") || matchText.contains("postgres")) {
            category = categoryRepository.findBySlug("database").orElse(null);
        } else if (matchText.contains("socket") || matchText.contains("dns") || matchText.contains("cors") || matchText.contains("network")) {
            category = categoryRepository.findBySlug("network").orElse(null);
        } else if (matchText.contains("unauthorized") || matchText.contains("jwt") || matchText.contains("token") || matchText.contains("forbidden") || matchText.contains("auth")) {
            category = categoryRepository.findBySlug("authentication").orElse(null);
        } else if (matchText.contains("memory") || matchText.contains("oom") || matchText.contains("heap") || matchText.contains("garbage collector")) {
            category = categoryRepository.findBySlug("memory").orElse(null);
        } else if (matchText.contains("deadlock") || matchText.contains("thread lock") || matchText.contains("race condition") || matchText.contains("concurrency")) {
            category = categoryRepository.findBySlug("concurrency").orElse(null);
        }
        issue.setCategory(category);

        // 3. Tags
        java.util.Set<Tag> tags = new java.util.HashSet<>();
        if (matchText.contains("nullpointer")) {
            tagRepository.findBySlug("nullpointer").ifPresent(tags::add);
        }
        if (matchText.contains("oom") || matchText.contains("out of memory")) {
            tagRepository.findBySlug("oom").ifPresent(tags::add);
        }
        if (matchText.contains("timeout")) {
            tagRepository.findBySlug("timeout").ifPresent(tags::add);
        }
        if (matchText.contains("cors")) {
            tagRepository.findBySlug("cors").ifPresent(tags::add);
        }
        if (matchText.contains("deadlock")) {
            tagRepository.findBySlug("deadlock").ifPresent(tags::add);
        }
        if (matchText.contains("production") || matchText.contains("prod")) {
            tagRepository.findBySlug("prod-crash").ifPresent(tags::add);
        }
        
        issue.setTags(tags);
    }
}
