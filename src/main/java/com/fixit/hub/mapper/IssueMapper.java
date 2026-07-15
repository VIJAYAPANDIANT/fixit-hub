package com.fixit.hub.mapper;

import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.dto.IssueResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface IssueMapper {

    @Mapping(source = "project.id", target = "projectId")
    @Mapping(source = "assignedTo.id", target = "assignedToUserId")
    @Mapping(source = "assignedTo.name", target = "assignedToName")
    @Mapping(source = "language.name", target = "languageName")
    @Mapping(source = "language.slug", target = "languageSlug")
    @Mapping(source = "framework.name", target = "frameworkName")
    @Mapping(source = "framework.slug", target = "frameworkSlug")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "category.slug", target = "categorySlug")
    @Mapping(target = "tags", expression = "java(issue.getTags() != null ? issue.getTags().stream().map(com.fixit.hub.domain.entity.Tag::getName).collect(java.util.stream.Collectors.toList()) : java.util.Collections.emptyList())")
    IssueResponse toResponse(Issue issue);

    @Mapping(source = "project.id", target = "projectId")
    @Mapping(source = "assignedTo.id", target = "assignedToUserId")
    @Mapping(source = "assignedTo.name", target = "assignedToName")
    @Mapping(source = "language.name", target = "languageName")
    @Mapping(source = "language.slug", target = "languageSlug")
    @Mapping(source = "framework.name", target = "frameworkName")
    @Mapping(source = "framework.slug", target = "frameworkSlug")
    @Mapping(source = "category.name", target = "categoryName")
    @Mapping(source = "category.slug", target = "categorySlug")
    @Mapping(target = "tags", expression = "java(issue.getTags() != null ? issue.getTags().stream().map(com.fixit.hub.domain.entity.Tag::getName).collect(java.util.stream.Collectors.toList()) : java.util.Collections.emptyList())")
    @Mapping(target = "createdAt", expression = "java(issue.getCreatedAt() != null ? issue.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toInstant() : null)")
    @Mapping(target = "firstSeen", expression = "java(issue.getFirstSeen() != null ? issue.getFirstSeen().atZone(java.time.ZoneId.systemDefault()).toInstant() : null)")
    @Mapping(target = "lastSeen", expression = "java(issue.getLastSeen() != null ? issue.getLastSeen().atZone(java.time.ZoneId.systemDefault()).toInstant() : null)")
    com.fixit.hub.domain.document.IssueDocument toDocument(Issue issue);

    @Mapping(source = "projectId", target = "projectId")
    @Mapping(source = "assignedToUserId", target = "assignedToUserId")
    @Mapping(source = "assignedToName", target = "assignedToName")
    @Mapping(target = "firstSeen", expression = "java(document.getFirstSeen() != null ? java.time.LocalDateTime.ofInstant(document.getFirstSeen(), java.time.ZoneId.systemDefault()) : null)")
    @Mapping(target = "lastSeen", expression = "java(document.getLastSeen() != null ? java.time.LocalDateTime.ofInstant(document.getLastSeen(), java.time.ZoneId.systemDefault()) : null)")
    IssueResponse toResponseFromDocument(com.fixit.hub.domain.document.IssueDocument document);
}
