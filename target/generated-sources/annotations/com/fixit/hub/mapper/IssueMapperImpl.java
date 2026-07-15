package com.fixit.hub.mapper;

import com.fixit.hub.domain.document.IssueDocument;
import com.fixit.hub.domain.entity.Category;
import com.fixit.hub.domain.entity.Framework;
import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.domain.entity.IssueDifficulty;
import com.fixit.hub.domain.entity.IssueSeverity;
import com.fixit.hub.domain.entity.IssueStatus;
import com.fixit.hub.domain.entity.ProgrammingLanguage;
import com.fixit.hub.domain.entity.Project;
import com.fixit.hub.domain.entity.User;
import com.fixit.hub.dto.IssueResponse;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-15T20:59:40+0530",
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
        String languageName = null;
        String languageSlug = null;
        String frameworkName = null;
        String frameworkSlug = null;
        String categoryName = null;
        String categorySlug = null;
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
        languageName = issueLanguageName( issue );
        languageSlug = issueLanguageSlug( issue );
        frameworkName = issueFrameworkName( issue );
        frameworkSlug = issueFrameworkSlug( issue );
        categoryName = issueCategoryName( issue );
        categorySlug = issueCategorySlug( issue );
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

        List<String> tags = issue.getTags() != null ? issue.getTags().stream().map(com.fixit.hub.domain.entity.Tag::getName).collect(java.util.stream.Collectors.toList()) : java.util.Collections.emptyList();

        IssueResponse issueResponse = new IssueResponse( id, projectId, fingerprint, title, message, description, rootCause, verifiedFix, codeSnippet, status, severity, difficulty, popularity, views, assignedToUserId, assignedToName, firstSeen, lastSeen, occurrencesCount, aiAnalysis, languageName, languageSlug, frameworkName, frameworkSlug, categoryName, categorySlug, tags );

        return issueResponse;
    }

    @Override
    public IssueDocument toDocument(Issue issue) {
        if ( issue == null ) {
            return null;
        }

        IssueDocument.IssueDocumentBuilder issueDocument = IssueDocument.builder();

        UUID id = issueProjectId( issue );
        if ( id != null ) {
            issueDocument.projectId( id.toString() );
        }
        UUID id1 = issueAssignedToId( issue );
        if ( id1 != null ) {
            issueDocument.assignedToUserId( id1.toString() );
        }
        issueDocument.assignedToName( issueAssignedToName( issue ) );
        issueDocument.languageName( issueLanguageName( issue ) );
        issueDocument.languageSlug( issueLanguageSlug( issue ) );
        issueDocument.frameworkName( issueFrameworkName( issue ) );
        issueDocument.frameworkSlug( issueFrameworkSlug( issue ) );
        issueDocument.categoryName( issueCategoryName( issue ) );
        issueDocument.categorySlug( issueCategorySlug( issue ) );
        if ( issue.getId() != null ) {
            issueDocument.id( issue.getId().toString() );
        }
        issueDocument.fingerprint( issue.getFingerprint() );
        issueDocument.title( issue.getTitle() );
        issueDocument.message( issue.getMessage() );
        issueDocument.description( issue.getDescription() );
        issueDocument.stacktrace( issue.getStacktrace() );
        issueDocument.rootCause( issue.getRootCause() );
        issueDocument.verifiedFix( issue.getVerifiedFix() );
        issueDocument.codeSnippet( issue.getCodeSnippet() );
        if ( issue.getStatus() != null ) {
            issueDocument.status( issue.getStatus().name() );
        }
        if ( issue.getSeverity() != null ) {
            issueDocument.severity( issue.getSeverity().name() );
        }
        if ( issue.getDifficulty() != null ) {
            issueDocument.difficulty( issue.getDifficulty().name() );
        }
        issueDocument.popularity( issue.getPopularity() );
        issueDocument.views( issue.getViews() );
        issueDocument.occurrencesCount( issue.getOccurrencesCount() );
        issueDocument.aiAnalysis( issue.getAiAnalysis() );

        issueDocument.tags( issue.getTags() != null ? issue.getTags().stream().map(com.fixit.hub.domain.entity.Tag::getName).collect(java.util.stream.Collectors.toList()) : java.util.Collections.emptyList() );
        issueDocument.createdAt( issue.getCreatedAt() != null ? issue.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant() : null );
        issueDocument.firstSeen( issue.getFirstSeen() != null ? issue.getFirstSeen().atZone(java.time.ZoneId.systemDefault()).toInstant() : null );
        issueDocument.lastSeen( issue.getLastSeen() != null ? issue.getLastSeen().atZone(java.time.ZoneId.systemDefault()).toInstant() : null );

        return issueDocument.build();
    }

    @Override
    public IssueResponse toResponseFromDocument(IssueDocument document) {
        if ( document == null ) {
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
        int occurrencesCount = 0;
        String aiAnalysis = null;
        String languageName = null;
        String languageSlug = null;
        String frameworkName = null;
        String frameworkSlug = null;
        String categoryName = null;
        String categorySlug = null;
        List<String> tags = null;

        if ( document.getProjectId() != null ) {
            projectId = UUID.fromString( document.getProjectId() );
        }
        if ( document.getAssignedToUserId() != null ) {
            assignedToUserId = UUID.fromString( document.getAssignedToUserId() );
        }
        assignedToName = document.getAssignedToName();
        if ( document.getId() != null ) {
            id = UUID.fromString( document.getId() );
        }
        fingerprint = document.getFingerprint();
        title = document.getTitle();
        message = document.getMessage();
        description = document.getDescription();
        rootCause = document.getRootCause();
        verifiedFix = document.getVerifiedFix();
        codeSnippet = document.getCodeSnippet();
        if ( document.getStatus() != null ) {
            status = Enum.valueOf( IssueStatus.class, document.getStatus() );
        }
        if ( document.getSeverity() != null ) {
            severity = Enum.valueOf( IssueSeverity.class, document.getSeverity() );
        }
        if ( document.getDifficulty() != null ) {
            difficulty = Enum.valueOf( IssueDifficulty.class, document.getDifficulty() );
        }
        popularity = document.getPopularity();
        views = document.getViews();
        occurrencesCount = document.getOccurrencesCount();
        aiAnalysis = document.getAiAnalysis();
        languageName = document.getLanguageName();
        languageSlug = document.getLanguageSlug();
        frameworkName = document.getFrameworkName();
        frameworkSlug = document.getFrameworkSlug();
        categoryName = document.getCategoryName();
        categorySlug = document.getCategorySlug();
        List<String> list = document.getTags();
        if ( list != null ) {
            tags = new ArrayList<String>( list );
        }

        LocalDateTime firstSeen = document.getFirstSeen() != null ? java.time.LocalDateTime.ofInstant(document.getFirstSeen(), java.time.ZoneId.systemDefault()) : null;
        LocalDateTime lastSeen = document.getLastSeen() != null ? java.time.LocalDateTime.ofInstant(document.getLastSeen(), java.time.ZoneId.systemDefault()) : null;

        IssueResponse issueResponse = new IssueResponse( id, projectId, fingerprint, title, message, description, rootCause, verifiedFix, codeSnippet, status, severity, difficulty, popularity, views, assignedToUserId, assignedToName, firstSeen, lastSeen, occurrencesCount, aiAnalysis, languageName, languageSlug, frameworkName, frameworkSlug, categoryName, categorySlug, tags );

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

    private String issueLanguageName(Issue issue) {
        if ( issue == null ) {
            return null;
        }
        ProgrammingLanguage language = issue.getLanguage();
        if ( language == null ) {
            return null;
        }
        String name = language.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    private String issueLanguageSlug(Issue issue) {
        if ( issue == null ) {
            return null;
        }
        ProgrammingLanguage language = issue.getLanguage();
        if ( language == null ) {
            return null;
        }
        String slug = language.getSlug();
        if ( slug == null ) {
            return null;
        }
        return slug;
    }

    private String issueFrameworkName(Issue issue) {
        if ( issue == null ) {
            return null;
        }
        Framework framework = issue.getFramework();
        if ( framework == null ) {
            return null;
        }
        String name = framework.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    private String issueFrameworkSlug(Issue issue) {
        if ( issue == null ) {
            return null;
        }
        Framework framework = issue.getFramework();
        if ( framework == null ) {
            return null;
        }
        String slug = framework.getSlug();
        if ( slug == null ) {
            return null;
        }
        return slug;
    }

    private String issueCategoryName(Issue issue) {
        if ( issue == null ) {
            return null;
        }
        Category category = issue.getCategory();
        if ( category == null ) {
            return null;
        }
        String name = category.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    private String issueCategorySlug(Issue issue) {
        if ( issue == null ) {
            return null;
        }
        Category category = issue.getCategory();
        if ( category == null ) {
            return null;
        }
        String slug = category.getSlug();
        if ( slug == null ) {
            return null;
        }
        return slug;
    }
}
