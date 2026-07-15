package com.fixit.hub.service.impl;

import com.fixit.hub.domain.document.EventLog;
import com.fixit.hub.domain.entity.*;
import com.fixit.hub.dto.CommentResponse;
import com.fixit.hub.dto.ErrorRequest;
import com.fixit.hub.dto.IssueResponse;
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
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

        issueRepository.save(issue);
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

        issueRepository.save(issue);
        return issueMapper.toResponse(issue);
    }

    @Override
    @Transactional
    public void deleteError(UUID id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Error log not found with ID: " + id));
        issueRepository.delete(issue);
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

    @Override
    @Transactional
    public IssueResponse getIssueById(UUID id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with ID: " + id));
        
        // Increment views count on details request
        issue.setViews(issue.getViews() + 1);
        issueRepository.save(issue);
        
        return issueMapper.toResponse(issue);
    }

    @Override
    @Transactional
    public IssueResponse updateIssueStatus(UUID id, IssueStatus status) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with ID: " + id));
        issue.setStatus(status);
        issueRepository.save(issue);
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
