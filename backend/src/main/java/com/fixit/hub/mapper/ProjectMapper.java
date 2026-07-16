package com.fixit.hub.mapper;

import com.fixit.hub.domain.entity.Project;
import com.fixit.hub.dto.ProjectResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProjectMapper {
    ProjectResponse toResponse(Project project);
}
