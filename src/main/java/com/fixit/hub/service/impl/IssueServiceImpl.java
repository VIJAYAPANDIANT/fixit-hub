package com.fixit.hub.service.impl;

import com.fixit.hub.domain.document.EventLog;
import com.fixit.hub.domain.entity.*;
import com.fixit.hub.dto.CommentResponse;
import com.fixit.hub.dto.ErrorRequest;
import com.fixit.hub.dto.IssueResponse;
import com.fixit.hub.dto.IssueSearchResponse;
import com.fixit.hub.exception.BadRequestException;
import com.fixit.hub.exception.ResourceNotFoundException;
import com.fixit.hub.mapper.CommentMapper;
import com.fixit.hub.mapper.IssueMapper;
import com.fixit.hub.repository.es.EventLogRepository;
import com.fixit.hub.repository.jpa.CommentRepository;
import com.fixit.hub.repository.jpa.IssueRepository;
import com.fixit.hub.repository.jpa.ProjectRepository;
import com.fixit.hub.repository.jpa.UserRepository;
import com.fixit.hub.service.IssueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final EventLogRepository eventLogRepository;
    private final IssueMapper issueMapper;
    private final CommentMapper commentMapper;
    private final com.fixit.hub.repository.es.IssueDocumentRepository issueDocumentRepository;
    private final com.fixit.hub.service.IssueSearchService issueSearchService;
    private final com.fixit.hub.repository.jpa.ProgrammingLanguageRepository programmingLanguageRepository;
    private final com.fixit.hub.repository.jpa.FrameworkRepository frameworkRepository;
    private final com.fixit.hub.repository.jpa.CategoryRepository categoryRepository;
    private final com.fixit.hub.repository.jpa.TagRepository tagRepository;

    @Override
    @Transactional
    public IssueResponse createError(ErrorRequest request) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + request.projectId()));

        String fingerprint = DigestUtils.md5DigestAsHex(request.title().getBytes(StandardCharsets.UTF_8));
        UUID issueId = UUID.nameUUIDFromBytes(fingerprint.getBytes(StandardCharsets.UTF_8));

        if (issueRepository.existsById(issueId)) {
            throw new BadRequestException("An error with a similar signature already exists in this project.");
        }

        LocalDateTime now = LocalDateTime.now();
        Issue issue = Issue.builder()
                .id(issueId)
                .project(project)
                .fingerprint(fingerprint)
                .title(request.title())
                .description(request.description())
                .message(request.message())
                .stacktrace(request.stacktrace())
                .rootCause(request.rootCause())
                .verifiedFix(request.verifiedFix())
                .codeSnippet(request.codeSnippet())
                .status(request.status())
                .severity(request.severity())
                .difficulty(request.difficulty())
                .popularity(0)
                .views(0)
                .firstSeen(now)
                .lastSeen(now)
                .occurrencesCount(1)
                .build();

        if (request.languageId() != null) {
            issue.setLanguage(programmingLanguageRepository.findById(request.languageId()).orElse(null));
        }
        if (request.frameworkId() != null) {
            issue.setFramework(frameworkRepository.findById(request.frameworkId()).orElse(null));
        }
        if (request.categoryId() != null) {
            issue.setCategory(categoryRepository.findById(request.categoryId()).orElse(null));
        }
        if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            issue.setTags(new java.util.HashSet<>(tagRepository.findAllById(request.tagIds())));
        }

        issueRepository.save(issue);

        // Sync to Elasticsearch
        try {
            issueDocumentRepository.save(issueMapper.toDocument(issue));
        } catch (Exception e) {
            log.error("Failed to index new issue in Elasticsearch: {}", e.getMessage());
        }

        return issueMapper.toResponse(issue);
    }

    @Override
    @Transactional
    public IssueResponse updateError(UUID id, ErrorRequest request) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Error log not found with ID: " + id));

        issue.setTitle(request.title());
        issue.setDescription(request.description());
        issue.setMessage(request.message());
        issue.setStacktrace(request.stacktrace());
        issue.setRootCause(request.rootCause());
        issue.setVerifiedFix(request.verifiedFix());
        issue.setCodeSnippet(request.codeSnippet());
        issue.setStatus(request.status());
        issue.setSeverity(request.severity());
        issue.setDifficulty(request.difficulty());

        if (request.languageId() != null) {
            issue.setLanguage(programmingLanguageRepository.findById(request.languageId()).orElse(null));
        } else {
            issue.setLanguage(null);
        }
        if (request.frameworkId() != null) {
            issue.setFramework(frameworkRepository.findById(request.frameworkId()).orElse(null));
        } else {
            issue.setFramework(null);
        }
        if (request.categoryId() != null) {
            issue.setCategory(categoryRepository.findById(request.categoryId()).orElse(null));
        } else {
            issue.setCategory(null);
        }
        if (request.tagIds() != null) {
            issue.setTags(new java.util.HashSet<>(tagRepository.findAllById(request.tagIds())));
        } else {
            issue.setTags(null);
        }

        issueRepository.save(issue);

        // Sync to Elasticsearch
        try {
            issueDocumentRepository.save(issueMapper.toDocument(issue));
        } catch (Exception e) {
            log.error("Failed to index updated issue in Elasticsearch: {}", e.getMessage());
        }

        return issueMapper.toResponse(issue);
    }

    @Override
    @Transactional
    public void deleteError(UUID id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Error log not found with ID: " + id));
        issueRepository.delete(issue);
        try {
            issueDocumentRepository.deleteById(id.toString());
        } catch (Exception e) {
            log.error("Failed to delete issue from Elasticsearch: {}", e.getMessage());
        }
    }

    @Override
    public List<IssueResponse> getFilteredIssues(
            UUID projectId,
            IssueStatus status,
            IssueSeverity severity,
            IssueDifficulty difficulty,
            String search,
            String sortBy
    ) {
        // Try querying Elasticsearch first
        try {
            IssueSearchResponse searchResponse = issueSearchService.searchIssues(
                    projectId,
                    search,
                    status,
                    severity,
                    difficulty,
                    null, // language
                    null, // framework
                    null, // category
                    null, // tags
                    sortBy
            );
            return searchResponse.issues();
        } catch (Exception e) {
            log.warn("Elasticsearch query failed, falling back to database LIKE query: {}", e.getMessage());
            
            // Database fallback
            Sort sortOrder;
            if ("popularity".equalsIgnoreCase(sortBy)) {
                sortOrder = Sort.by(Sort.Direction.DESC, "popularity");
            } else if ("views".equalsIgnoreCase(sortBy)) {
                sortOrder = Sort.by(Sort.Direction.DESC, "views");
            } else {
                sortOrder = Sort.by(Sort.Direction.DESC, "lastSeen");
            }

            return issueRepository.findFilteredIssues(projectId, status, severity, difficulty, search, sortOrder)
                    .stream()
                    .map(issueMapper::toResponse)
                    .collect(Collectors.toList());
        }
    }

    @Override
    @Transactional
    public IssueResponse getIssueById(UUID id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with ID: " + id));
        
        // Increment views count on details request
        issue.setViews(issue.getViews() + 1);
        issueRepository.save(issue);

        // Sync view increment to Elasticsearch
        try {
            issueDocumentRepository.save(issueMapper.toDocument(issue));
        } catch (Exception e) {
            log.error("Failed to index issue view increment in Elasticsearch: {}", e.getMessage());
        }
        
        return issueMapper.toResponse(issue);
    }

    @Override
    @Transactional
    public IssueResponse updateIssueStatus(UUID id, IssueStatus status) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with ID: " + id));
        issue.setStatus(status);
        issueRepository.save(issue);

        // Sync status to Elasticsearch
        try {
            issueDocumentRepository.save(issueMapper.toDocument(issue));
        } catch (Exception e) {
            log.error("Failed to sync issue status update to Elasticsearch: {}", e.getMessage());
        }

        return issueMapper.toResponse(issue);
    }

    @Override
    @Transactional
    public IssueResponse assignIssue(UUID id, UUID userId) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with ID: " + id));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        issue.setAssignedTo(user);
        issueRepository.save(issue);

        // Sync assignment to Elasticsearch
        try {
            issueDocumentRepository.save(issueMapper.toDocument(issue));
        } catch (Exception e) {
            log.error("Failed to sync issue assignment to Elasticsearch: {}", e.getMessage());
        }

        return issueMapper.toResponse(issue);
    }

    @Override
    @Transactional
    public CommentResponse addComment(UUID id, UUID userId, String content) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with ID: " + id));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Comment comment = Comment.builder()
                .issue(issue)
                .user(user)
                .content(content)
                .build();

        commentRepository.save(comment);
        return commentMapper.toResponse(comment);
    }

    @Override
    public List<CommentResponse> getComments(UUID id) {
        return commentRepository.findByIssueIdOrderByCreatedAtAsc(id).stream()
                .map(commentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<EventLog> getIssueEvents(UUID id) {
        return eventLogRepository.findByIssueIdOrderByTimestampDesc(id.toString());
    }
}
