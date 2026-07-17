package com.fixit.hub.service;

import com.fixit.hub.domain.document.IssueDocument;
import com.fixit.hub.domain.entity.*;
import com.fixit.hub.dto.*;
import com.fixit.hub.exception.BadRequestException;
import com.fixit.hub.exception.ResourceNotFoundException;
import com.fixit.hub.mapper.CommentMapper;
import com.fixit.hub.mapper.IssueMapper;
import com.fixit.hub.repository.es.EventLogRepository;
import com.fixit.hub.repository.es.IssueDocumentRepository;
import com.fixit.hub.repository.jpa.*;
import com.fixit.hub.service.impl.IssueServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class IssueServiceTest {

    @Mock private IssueRepository issueRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private EventLogRepository eventLogRepository;
    @Mock private IssueMapper issueMapper;
    @Mock private CommentMapper commentMapper;
    @Mock private IssueDocumentRepository issueDocumentRepository;
    @Mock private IssueSearchService issueSearchService;
    @Mock private ProgrammingLanguageRepository programmingLanguageRepository;
    @Mock private FrameworkRepository frameworkRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private TagRepository tagRepository;

    @InjectMocks
    private IssueServiceImpl issueService;

    private UUID projectId;
    private Project project;
    private ErrorRequest request;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        project = Project.builder()
                .id(projectId)
                .name("Test Project")
                .dsnKey("dsn")
                .build();

        request = new ErrorRequest(
                projectId,
                "NullPointerException in Auth",
                "NPE in Authentication Service",
                "Null Pointer Exception",
                "stacktrace goes here",
                "Root cause context",
                "Verified fix description",
                "code snippet",
                IssueStatus.UNRESOLVED,
                IssueSeverity.HIGH,
                IssueDifficulty.MODERATE,
                null, null, null, null
        );
    }

    @Test
    void testCreateError_ProjectNotFound() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> issueService.createError(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Project not found");

        verify(issueRepository, never()).save(any());
    }

    @Test
    void testCreateError_DuplicateSignature() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        String fingerprint = DigestUtils.md5DigestAsHex(request.title().getBytes(StandardCharsets.UTF_8));
        UUID issueId = UUID.nameUUIDFromBytes(fingerprint.getBytes(StandardCharsets.UTF_8));

        when(issueRepository.existsById(issueId)).thenReturn(true);

        assertThatThrownBy(() -> issueService.createError(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("similar signature already exists");

        verify(issueRepository, never()).save(any());
    }

    @Test
    void testCreateError_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        String fingerprint = DigestUtils.md5DigestAsHex(request.title().getBytes(StandardCharsets.UTF_8));
        UUID issueId = UUID.nameUUIDFromBytes(fingerprint.getBytes(StandardCharsets.UTF_8));

        when(issueRepository.existsById(issueId)).thenReturn(false);

        IssueResponse mockResponse = new IssueResponse(
                issueId, "NullPointerException in Auth", "Null Pointer Exception",
                "stacktrace goes here", "NPE in Authentication Service", "Root cause context",
                "Verified fix description", "code snippet", IssueStatus.UNRESOLVED,
                IssueSeverity.HIGH, IssueDifficulty.MODERATE, 0, 0,
                null, null, null, Collections.emptySet(), null, null, null, 1
        );

        when(issueRepository.save(any(Issue.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(issueMapper.toDocument(any(Issue.class))).thenReturn(new IssueDocument());
        when(issueMapper.toResponse(any(Issue.class))).thenReturn(mockResponse);

        IssueResponse result = issueService.createError(request);

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(issueId);
        verify(issueRepository, times(1)).save(any(Issue.class));
        verify(issueDocumentRepository, times(1)).save(any(IssueDocument.class));
    }

    @Test
    void testUpdateError_NotFound() {
        UUID randomId = UUID.randomUUID();
        when(issueRepository.findById(randomId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> issueService.updateError(randomId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Error log not found");
    }

    @Test
    void testUpdateError_Success() {
        UUID issueId = UUID.randomUUID();
        Issue existingIssue = Issue.builder()
                .id(issueId)
                .project(project)
                .fingerprint("fp")
                .title("Old Title")
                .status(IssueStatus.UNRESOLVED)
                .severity(IssueSeverity.LOW)
                .difficulty(IssueDifficulty.EASY)
                .build();

        when(issueRepository.findById(issueId)).thenReturn(Optional.of(existingIssue));
        when(issueRepository.save(any(Issue.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(issueMapper.toDocument(any(Issue.class))).thenReturn(new IssueDocument());

        IssueResponse mockResponse = new IssueResponse(
                issueId, "NullPointerException in Auth", "Null Pointer Exception",
                "stacktrace goes here", "NPE in Authentication Service", "Root cause context",
                "Verified fix description", "code snippet", IssueStatus.UNRESOLVED,
                IssueSeverity.HIGH, IssueDifficulty.MODERATE, 0, 0,
                null, null, null, Collections.emptySet(), null, null, null, 1
        );
        when(issueMapper.toResponse(any(Issue.class))).thenReturn(mockResponse);

        IssueResponse result = issueService.updateError(issueId, request);

        assertThat(result).isNotNull();
        assertThat(result.title()).isEqualTo("NullPointerException in Auth");
        verify(issueRepository, times(1)).save(any(Issue.class));
        verify(issueDocumentRepository, times(1)).save(any(IssueDocument.class));
    }

    @Test
    void testDeleteError_Success() {
        UUID issueId = UUID.randomUUID();
        Issue existingIssue = Issue.builder().id(issueId).build();

        when(issueRepository.findById(issueId)).thenReturn(Optional.of(existingIssue));

        issueService.deleteError(issueId);

        verify(issueRepository, times(1)).delete(existingIssue);
        verify(issueDocumentRepository, times(1)).deleteById(issueId.toString());
    }

    @Test
    void testGetFilteredIssues_ElasticsearchSuccess() {
        IssueResponse mockResponse = new IssueResponse(
                UUID.randomUUID(), "title", "msg", "trace", "desc", "root", "fix", "code",
                IssueStatus.UNRESOLVED, IssueSeverity.HIGH, IssueDifficulty.MODERATE, 0, 0,
                null, null, null, Collections.emptySet(), null, null, null, 1
        );
        IssueSearchResponse searchResponse = new IssueSearchResponse(List.of(mockResponse), 1L);

        when(issueSearchService.searchIssues(
                eq(projectId), eq("search"), eq(IssueStatus.UNRESOLVED),
                eq(IssueSeverity.HIGH), eq(IssueDifficulty.MODERATE), any(), any(), any(), any(), eq("popularity")
        )).thenReturn(searchResponse);

        List<IssueResponse> results = issueService.getFilteredIssues(
                projectId, IssueStatus.UNRESOLVED, IssueSeverity.HIGH, IssueDifficulty.MODERATE, "search", "popularity"
        );

        assertThat(results).hasSize(1);
        assertThat(results.get(0).title()).isEqualTo("title");
        verifyNoInteractions(issueRepository);
    }

    @Test
    void testGetFilteredIssues_ElasticsearchFallbackToDatabase() {
        when(issueSearchService.searchIssues(
                any(), any(), any(), any(), any(), any(), any(), any(), any(), any()
        )).thenThrow(new RuntimeException("Elasticsearch is down"));

        Issue existingIssue = Issue.builder()
                .id(UUID.randomUUID())
                .title("DB fallback issue")
                .status(IssueStatus.UNRESOLVED)
                .severity(IssueSeverity.HIGH)
                .difficulty(IssueDifficulty.MODERATE)
                .build();

        when(issueRepository.findFilteredIssues(
                eq(projectId), eq(IssueStatus.UNRESOLVED), eq(IssueSeverity.HIGH), eq(IssueDifficulty.MODERATE),
                eq("search"), any(Sort.class)
        )).thenReturn(List.of(existingIssue));

        IssueResponse mockResponse = new IssueResponse(
                existingIssue.getId(), "DB fallback issue", "msg", "trace", "desc", "root", "fix", "code",
                IssueStatus.UNRESOLVED, IssueSeverity.HIGH, IssueDifficulty.MODERATE, 0, 0,
                null, null, null, Collections.emptySet(), null, null, null, 1
        );
        when(issueMapper.toResponse(existingIssue)).thenReturn(mockResponse);

        List<IssueResponse> results = issueService.getFilteredIssues(
                projectId, IssueStatus.UNRESOLVED, IssueSeverity.HIGH, IssueDifficulty.MODERATE, "search", "popularity"
        );

        assertThat(results).hasSize(1);
        assertThat(results.get(0).title()).isEqualTo("DB fallback issue");
        verify(issueRepository, times(1)).findFilteredIssues(any(), any(), any(), any(), any(), any());
    }
}
