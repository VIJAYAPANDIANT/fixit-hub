package com.fixit.hub.service.impl;

import com.fixit.hub.domain.entity.Organization;
import com.fixit.hub.domain.entity.Project;
import com.fixit.hub.dto.ProjectResponse;
import com.fixit.hub.exception.ResourceNotFoundException;
import com.fixit.hub.mapper.ProjectMapper;
import com.fixit.hub.repository.jpa.OrganizationRepository;
import com.fixit.hub.repository.jpa.ProjectRepository;
import com.fixit.hub.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final ProjectMapper projectMapper;

    @Override
    @Transactional
    public ProjectResponse createProject(String name, UUID organizationId) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found with ID: " + organizationId));

        // Generate a random token for DSN authentication
        String token = UUID.randomUUID().toString().replace("-", "");
        UUID projectId = UUID.randomUUID();
        
        // Formulate DSN endpoint: http://{token}@{host}:{port}/{projectId}
        String dsnKey = String.format("http://%s@localhost:8080/%s", token, projectId);

        Project project = Project.builder()
                .id(projectId)
                .name(name)
                .organization(organization)
                .dsnKey(dsnKey)
                .build();

        projectRepository.save(project);
        return projectMapper.toResponse(project);
    }

    @Override
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(projectMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProjectResponse getProjectById(UUID id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));
        return projectMapper.toResponse(project);
    }
}
