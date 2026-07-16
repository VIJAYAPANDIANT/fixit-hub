package com.fixit.hub.service;

import com.fixit.hub.dto.ProjectResponse;
import java.util.List;
import java.util.UUID;

public interface ProjectService {
    ProjectResponse createProject(String name, UUID organizationId);
    List<ProjectResponse> getAllProjects();
    ProjectResponse getProjectById(UUID id);
}
