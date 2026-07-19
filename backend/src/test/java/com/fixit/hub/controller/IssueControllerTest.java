package com.fixit.hub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fixit.hub.domain.document.EventLog;
import com.fixit.hub.domain.entity.*;
import com.fixit.hub.dto.AIAnalysisResponse;
import com.fixit.hub.dto.CommentRequest;
import com.fixit.hub.dto.CommentResponse;
import com.fixit.hub.dto.IssueResponse;
import com.fixit.hub.dto.ScrapedFixResponse;
import com.fixit.hub.repository.jpa.UserRepository;
import com.fixit.hub.security.JwtAuthenticationFilter;
import com.fixit.hub.service.AIService;
import com.fixit.hub.service.IssueService;
import com.fixit.hub.service.ScraperService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = IssueController.class)
@AutoConfigureMockMvc(addFilters = false)
public class IssueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean private IssueService issueService;
    @MockBean private AIService aiService;
    @MockBean private ScraperService scraperService;

    // Security mocks to load the WebMvcTest context successfully
    @MockBean private UserRepository userRepository;
    @MockBean private JwtAuthenticationFilter jwtAuthenticationFilter;

    private UUID projectId;
    private UUID issueId;
    private IssueResponse mockIssueResponse;
    private User mockUser;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        issueId = UUID.randomUUID();

        mockIssueResponse = new IssueResponse(
                issueId, projectId, "fp_fingerprint", "NullPointerException", "Message",
                "Trace", "Desc", "Cause", "Fix", IssueStatus.UNRESOLVED,
                IssueSeverity.HIGH, IssueDifficulty.MEDIUM, 0, 0,
                null, null, LocalDateTime.now(), LocalDateTime.now(), 1,
                null, null, null, null, null, null, null, Collections.emptyList()
        );

        mockUser = User.builder()
                .id(UUID.randomUUID())
                .email("dev@fixit.com")
                .name("Dev User")
                .role(UserRole.DEVELOPER)
                .build();

        Authentication auth = new UsernamePasswordAuthenticationToken(mockUser, null, mockUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testGetFilteredIssues() throws Exception {
        when(issueService.getFilteredIssues(eq(projectId), eq(IssueStatus.UNRESOLVED), eq(IssueSeverity.HIGH), any(), any(), any()))
                .thenReturn(List.of(mockIssueResponse));

        mockMvc.perform(get("/api/projects/{projectId}/issues", projectId)
                        .param("status", "UNRESOLVED")
                        .param("severity", "HIGH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(issueId.toString()))
                .andExpect(jsonPath("$[0].title").value("NullPointerException"));
    }

    @Test
    void testGetIssueById() throws Exception {
        when(issueService.getIssueById(issueId)).thenReturn(mockIssueResponse);

        mockMvc.perform(get("/api/issues/{id}", issueId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(issueId.toString()))
                .andExpect(jsonPath("$.title").value("NullPointerException"));
    }

    @Test
    void testUpdateIssueStatus() throws Exception {
        IssueController.UpdateStatusRequest request = new IssueController.UpdateStatusRequest(IssueStatus.RESOLVED);
        when(issueService.updateIssueStatus(issueId, IssueStatus.RESOLVED)).thenReturn(mockIssueResponse);

        mockMvc.perform(put("/api/issues/{id}/status", issueId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void testAssignIssue() throws Exception {
        UUID devId = UUID.randomUUID();
        IssueController.AssignIssueRequest request = new IssueController.AssignIssueRequest(devId);
        when(issueService.assignIssue(issueId, devId)).thenReturn(mockIssueResponse);

        mockMvc.perform(put("/api/issues/{id}/assign", issueId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void testAddComment() throws Exception {
        CommentRequest request = new CommentRequest("This is a helpful test comment");
        CommentResponse mockCommentResponse = new CommentResponse(
                UUID.randomUUID(), issueId, mockUser.getId(), "Dev User", "This is a helpful test comment", LocalDateTime.now()
        );

        when(issueService.addComment(eq(issueId), eq(mockUser.getId()), eq("This is a helpful test comment")))
                .thenReturn(mockCommentResponse);

        mockMvc.perform(post("/api/issues/{id}/comments", issueId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("This is a helpful test comment"));
    }

    @Test
    void testGetComments() throws Exception {
        CommentResponse mockCommentResponse = new CommentResponse(
                UUID.randomUUID(), issueId, mockUser.getId(), "Dev User", "Comment content", LocalDateTime.now()
        );
        when(issueService.getComments(issueId)).thenReturn(List.of(mockCommentResponse));

        mockMvc.perform(get("/api/issues/{id}/comments", issueId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content").value("Comment content"));
    }

    @Test
    void testGetIssueEvents() throws Exception {
        EventLog eventLog = new EventLog();
        eventLog.setId("event-123");
        eventLog.setExceptionType("NullPointerException");
        when(issueService.getIssueEvents(issueId)).thenReturn(List.of(eventLog));

        mockMvc.perform(get("/api/issues/{id}/events", issueId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("event-123"));
    }

    @Test
    void testGetAIDiagnosis() throws Exception {
        AIAnalysisResponse mockAIResponse = new AIAnalysisResponse(
                "NullPointerException analysis", "Explanation here", "Ensure user object is not null",
                "Check for null arguments", "String name = user.getName()", "Best practices here", 0.95
        );
        when(aiService.getAIDiagnosis(eq(issueId), any())).thenReturn(mockAIResponse);

        mockMvc.perform(post("/api/issues/{id}/ai-diagnose", issueId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("NullPointerException analysis"));
    }

    @Test
    void testGetScrapedFixes() throws Exception {
        ScrapedFixResponse mockFix = new ScrapedFixResponse(
                UUID.randomUUID(), "StackOverflow", "Title", "URL", "Content", LocalDateTime.now()
        );
        when(scraperService.getScrapedFixes(issueId)).thenReturn(List.of(mockFix));

        mockMvc.perform(get("/api/issues/{id}/scraped-fixes", issueId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sourceName").value("StackOverflow"));
    }
}
