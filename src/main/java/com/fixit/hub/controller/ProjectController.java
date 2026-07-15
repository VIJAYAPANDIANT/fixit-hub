package com.fixit.hub.controller;

import com.fixit.hub.dto.ProjectResponse;
import com.fixit.hub.repository.jpa.OrganizationRepository;
import com.fixit.hub.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Projects", description = "Workspace project configuration endpoints")
public class ProjectController {

    private final ProjectService projectService;
    private final OrganizationRepository organizationRepository;

    public record CreateProjectRequest(String name, UUID organizationId) {}

    @PostMapping
    @Operation(summary = "Create a new project workspace", description = "Creates a project workspace linked to an organization")
    public ResponseEntity<ProjectResponse> createProject(@RequestBody CreateProjectRequest request) {
        UUID orgId = request.organizationId();
        if (orgId == null) {
            // Fetch default organization
            orgId = organizationRepository.findAll().stream()
                    .findFirst()
                    .map(org -> org.getId())
                    .orElseThrow(() -> new IllegalStateException("No organizations provisioned. Please register first."));
        }
        return ResponseEntity.ok(projectService.createProject(request.name(), orgId));
    }

    @GetMapping
    @Operation(summary = "List all project workspaces", description = "Returns a list of all active projects in the workspace")
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project details by ID", description = "Returns project DSN and configuration metadata")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }
}
