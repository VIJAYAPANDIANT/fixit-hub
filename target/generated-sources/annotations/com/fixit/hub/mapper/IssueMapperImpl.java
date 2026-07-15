package com.fixit.hub.mapper;

import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.domain.entity.IssueDifficulty;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;
import com.fixit.hub.domain.entity.Project;
import com.fixit.hub.domain.entity.User;
import com.fixit.hub.dto.IssueResponse;
import java.time.LocalDateTime;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-15T18:38:38+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.100.v20260624-0231, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class IssueMapperImpl implements IssueMapper {

    @Override
    public IssueResponse toResponse(Issue issue) {
        if ( issue == null ) {
            return null;
        }

        UUID projectId = null;
        UUID assignedToUserId = null;
        String assignedToName = null;
        UUID id = null;
        String fingerprint = null;
        String title = null;
        String message = null;
        String description = null;
        String rootCause = null;
        String verifiedFix = null;
        String codeSnippet = null;
        IssueStatus status = null;
        IssueSeverity severity = null;
        IssueDifficulty difficulty = null;
        int popularity = 0;
        int views = 0;
        LocalDateTime firstSeen = null;
        LocalDateTime lastSeen = null;
        int occurrencesCount = 0;
        String aiAnalysis = null;

        projectId = issueProjectId( issue );
        assignedToUserId = issueAssignedToId( issue );
        assignedToName = issueAssignedToName( issue );
        id = issue.getId();
        fingerprint = issue.getFingerprint();
        title = issue.getTitle();
        message = issue.getMessage();
        description = issue.getDescription();
        rootCause = issue.getRootCause();
        verifiedFix = issue.getVerifiedFix();
        codeSnippet = issue.getCodeSnippet();
        status = issue.getStatus();
        severity = issue.getSeverity();
        difficulty = issue.getDifficulty();
        popularity = issue.getPopularity();
        views = issue.getViews();
        firstSeen = issue.getFirstSeen();
        lastSeen = issue.getLastSeen();
        occurrencesCount = issue.getOccurrencesCount();
        aiAnalysis = issue.getAiAnalysis();

        IssueResponse issueResponse = new IssueResponse( id, projectId, fingerprint, title, message, description, rootCause, verifiedFix, codeSnippet, status, severity, difficulty, popularity, views, assignedToUserId, assignedToName, firstSeen, lastSeen, occurrencesCount, aiAnalysis );

        return issueResponse;
    }

    private UUID issueProjectId(Issue issue) {
        if ( issue == null ) {
            return null;
        }
        Project project = issue.getProject();
        if ( project == null ) {
            return null;
        }
        UUID id = project.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private UUID issueAssignedToId(Issue issue) {
        if ( issue == null ) {
            return null;
        }
        User assignedTo = issue.getAssignedTo();
        if ( assignedTo == null ) {
            return null;
        }
        UUID id = assignedTo.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String issueAssignedToName(Issue issue) {
        if ( issue == null ) {
            return null;
        }
        User assignedTo = issue.getAssignedTo();
        if ( assignedTo == null ) {
            return null;
        }
        String name = assignedTo.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}
