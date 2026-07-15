package com.fixit.hub.mapper;

import com.fixit.hub.domain.entity.Project;
import com.fixit.hub.dto.ProjectResponse;
import java.time.LocalDateTime;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-07-15T18:28:36+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.100.v20260624-0231, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class ProjectMapperImpl implements ProjectMapper {

    @Override
    public ProjectResponse toResponse(Project project) {
        if ( project == null ) {
            return null;
        }

        UUID id = null;
        String name = null;
        String dsnKey = null;
        LocalDateTime createdAt = null;

        id = project.getId();
        name = project.getName();
        dsnKey = project.getDsnKey();
        createdAt = project.getCreatedAt();

        ProjectResponse projectResponse = new ProjectResponse( id, name, dsnKey, createdAt );

        return projectResponse;
    }
}
