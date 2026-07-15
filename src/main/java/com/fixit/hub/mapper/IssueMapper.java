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
    IssueResponse toResponse(Issue issue);
}
