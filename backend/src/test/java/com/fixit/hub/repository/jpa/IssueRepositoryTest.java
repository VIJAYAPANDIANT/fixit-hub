package com.fixit.hub.repository.jpa;

import com.fixit.hub.domain.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
public class IssueRepositoryTest {

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private Project testProject;
    private Issue unresolvedHighIssue;
    private Issue resolvedMediumIssue;

    @BeforeEach
    void setUp() {
        Organization org = Organization.builder()
                .name("Test Org")
                .build();
        organizationRepository.save(org);

        testProject = Project.builder()
                .organization(org)
                .name("Test Project")
                .dsnKey("dsn_key_123")
                .build();
        projectRepository.save(testProject);

        unresolvedHighIssue = Issue.builder()
                .id(UUID.randomUUID())
                .project(testProject)
                .fingerprint("fingerprint1")
                .title("NullPointerException in UserService")
                .message("Null Pointer occurred while accessing user details")
                .description("UserService threw NPE")
                .status(IssueStatus.UNRESOLVED)
                .severity(IssueSeverity.HIGH)
                .difficulty(IssueDifficulty.MODERATE)
                .firstSeen(LocalDateTime.now())
                .lastSeen(LocalDateTime.now())
                .popularity(5)
                .views(10)
                .occurrencesCount(1)
                .build();

        resolvedMediumIssue = Issue.builder()
                .id(UUID.randomUUID())
                .project(testProject)
                .fingerprint("fingerprint2")
                .title("Database connection timeout")
                .message("Timeout error while executing database queries")
                .description("Pool connection timeout occurred during high peak load")
                .status(IssueStatus.RESOLVED)
                .severity(IssueSeverity.MEDIUM)
                .difficulty(IssueDifficulty.EASY)
                .firstSeen(LocalDateTime.now())
                .lastSeen(LocalDateTime.now())
                .popularity(2)
                .views(4)
                .occurrencesCount(1)
                .build();

        issueRepository.save(unresolvedHighIssue);
        issueRepository.save(resolvedMediumIssue);
    }

    @Test
    void testFindByProjectIdAndFingerprint() {
        var found = issueRepository.findByProjectIdAndFingerprint(testProject.getId(), "fingerprint1");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(unresolvedHighIssue.getId());
    }

    @Test
    void testFindFilteredIssues_NoFilters() {
        List<Issue> issues = issueRepository.findFilteredIssues(
                testProject.getId(), null, null, null, null, Sort.by(Sort.Direction.DESC, "popularity")
        );
        assertThat(issues).hasSize(2);
        assertThat(issues.get(0).getId()).isEqualTo(unresolvedHighIssue.getId()); // popularity 5 vs 2
    }

    @Test
    void testFindFilteredIssues_ByStatus() {
        List<Issue> issues = issueRepository.findFilteredIssues(
                testProject.getId(), IssueStatus.RESOLVED, null, null, null, Sort.by(Sort.Direction.DESC, "popularity")
        );
        assertThat(issues).hasSize(1);
        assertThat(issues.get(0).getId()).isEqualTo(resolvedMediumIssue.getId());
    }

    @Test
    void testFindFilteredIssues_BySeverity() {
        List<Issue> issues = issueRepository.findFilteredIssues(
                testProject.getId(), null, IssueSeverity.HIGH, null, null, Sort.by(Sort.Direction.DESC, "popularity")
        );
        assertThat(issues).hasSize(1);
        assertThat(issues.get(0).getId()).isEqualTo(unresolvedHighIssue.getId());
    }

    @Test
    void testFindFilteredIssues_ByDifficulty() {
        List<Issue> issues = issueRepository.findFilteredIssues(
                testProject.getId(), null, null, IssueDifficulty.EASY, null, Sort.by(Sort.Direction.DESC, "popularity")
        );
        assertThat(issues).hasSize(1);
        assertThat(issues.get(0).getId()).isEqualTo(resolvedMediumIssue.getId());
    }

    @Test
    void testFindFilteredIssues_BySearchText() {
        List<Issue> issues = issueRepository.findFilteredIssues(
                testProject.getId(), null, null, null, "timeout", Sort.by(Sort.Direction.DESC, "popularity")
        );
        assertThat(issues).hasSize(1);
        assertThat(issues.get(0).getId()).isEqualTo(resolvedMediumIssue.getId());
    }

    @Test
    void testFindFilteredIssues_BySearchTextCaseInsensitive() {
        List<Issue> issues = issueRepository.findFilteredIssues(
                testProject.getId(), null, null, null, "USER", Sort.by(Sort.Direction.DESC, "popularity")
        );
        assertThat(issues).hasSize(1);
        assertThat(issues.get(0).getId()).isEqualTo(unresolvedHighIssue.getId());
    }
}
