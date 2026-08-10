package com.fixit.hub.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.domain.entity.Project;
import com.fixit.hub.domain.entity.Webhook;
import com.fixit.hub.dto.WebhookRequest;
import com.fixit.hub.dto.WebhookResponse;
import com.fixit.hub.exception.ResourceNotFoundException;
import com.fixit.hub.repository.jpa.ProjectRepository;
import com.fixit.hub.repository.jpa.WebhookRepository;
import com.fixit.hub.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookServiceImpl implements WebhookService {

    private final WebhookRepository webhookRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    @Value("${FRONTEND_URL:https://fixit-hub-api.vercel.app}")
    private String frontendUrl;

    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Override
    public List<WebhookResponse> getProjectWebhooks(UUID projectId) {
        return webhookRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public WebhookResponse createWebhook(UUID projectId, WebhookRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        Webhook webhook = Webhook.builder()
                .project(project)
                .name(request.name())
                .url(request.url())
                .type(request.type().toUpperCase())
                .active(request.active() == null || request.active())
                .build();

        return mapToResponse(webhookRepository.save(webhook));
    }

    @Override
    @Transactional
    public WebhookResponse updateWebhook(UUID webhookId, WebhookRequest request) {
        Webhook webhook = webhookRepository.findById(webhookId)
                .orElseThrow(() -> new ResourceNotFoundException("Webhook not found with ID: " + webhookId));

        webhook.setName(request.name());
        webhook.setUrl(request.url());
        webhook.setType(request.type().toUpperCase());
        if (request.active() != null) {
            webhook.setActive(request.active());
        }

        return mapToResponse(webhookRepository.save(webhook));
    }

    @Override
    @Transactional
    public void deleteWebhook(UUID webhookId) {
        if (!webhookRepository.existsById(webhookId)) {
            throw new ResourceNotFoundException("Webhook not found with ID: " + webhookId);
        }
        webhookRepository.deleteById(webhookId);
    }

    @Override
    public void testWebhook(UUID webhookId) {
        Webhook webhook = webhookRepository.findById(webhookId)
                .orElseThrow(() -> new ResourceNotFoundException("Webhook not found with ID: " + webhookId));

        sendTestPayload(webhook);
    }

    @Async
    @Override
    public void triggerWebhooksForIssue(Issue issue, boolean isNewIssue) {
        UUID projectId = issue.getProject().getId();
        List<Webhook> activeWebhooks = webhookRepository.findByProjectIdAndActiveTrue(projectId);

        if (activeWebhooks.isEmpty()) {
            return;
        }

        log.info("Triggering {} webhooks for issue: {}", activeWebhooks.size(), issue.getId());
        for (Webhook webhook : activeWebhooks) {
            try {
                String payload = buildIssuePayload(webhook.getType(), issue, isNewIssue);
                sendPostRequest(webhook.getUrl(), payload);
            } catch (Exception e) {
                log.error("Failed to send webhook to {} ({}): {}", webhook.getName(), webhook.getUrl(), e.getMessage());
            }
        }
    }

    private void sendTestPayload(Webhook webhook) {
        try {
            String payload;
            if ("SLACK".equals(webhook.getType())) {
                payload = objectMapper.writeValueAsString(Map.of(
                        "text", "🤖 *FixIt Hub Webhook Test*\nConnection to \"" + webhook.getName() + "\" is successful! 🎉"
                ));
            } else {
                payload = objectMapper.writeValueAsString(Map.of(
                        "username", "FixIt Hub Alerts",
                        "content", "🤖 **FixIt Hub Webhook Test**\nConnection to \"" + webhook.getName() + "\" is successful! 🎉"
                ));
            }
            sendPostRequest(webhook.getUrl(), payload);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send test payload: " + e.getMessage(), e);
        }
    }

    private void sendPostRequest(String url, String jsonPayload) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(10))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new RuntimeException("Received status code: " + response.statusCode() + ", body: " + response.body());
        }
    }

    private String buildIssuePayload(String type, Issue issue, boolean isNewIssue) throws Exception {
        String alertTitle = isNewIssue ? "🚨 New Exception Detected" : "🔄 Exception Re-opened";
        String dashboardLink = frontendUrl + "/errors/" + issue.getId();
        String cleanMessage = issue.getMessage() != null ? issue.getMessage() : "No exception message provided";
        if (cleanMessage.length() > 500) {
            cleanMessage = cleanMessage.substring(0, 497) + "...";
        }

        if ("SLACK".equals(type)) {
            ObjectNode rootNode = objectMapper.createObjectNode();
            rootNode.put("text", alertTitle + ": " + issue.getTitle());

            ArrayNode blocks = rootNode.putArray("blocks");

            // Header
            ObjectNode header = blocks.addObject();
            header.put("type", "header");
            ObjectNode headerText = header.putObject("text");
            headerText.put("type", "plain_text");
            headerText.put("text", alertTitle);
            headerText.put("emoji", true);

            // Context
            ObjectNode context = blocks.addObject();
            context.put("type", "section");
            ArrayNode fields = context.putArray("fields");
            fields.addObject().put("type", "mrkdwn").put("text", "*Project:*\n" + issue.getProject().getName());
            fields.addObject().put("type", "mrkdwn").put("text", "*Severity:*\n`" + issue.getSeverity() + "`");

            // Title/Details
            ObjectNode details = blocks.addObject();
            details.put("type", "section");
            details.putObject("text")
                    .put("type", "mrkdwn")
                    .put("text", "*Exception details:*\n*" + issue.getTitle() + "*");

            // Stacktrace snippet / message
            ObjectNode msgSection = blocks.addObject();
            msgSection.put("type", "section");
            msgSection.putObject("text")
                    .put("type", "mrkdwn")
                    .put("text", "```" + cleanMessage + "```");

            // Actions button
            ObjectNode actions = blocks.addObject();
            actions.put("type", "actions");
            ArrayNode elements = actions.putArray("elements");
            ObjectNode button = elements.addObject();
            button.put("type", "button");
            button.putObject("text").put("type", "plain_text").put("text", "View in Dashboard");
            button.put("url", dashboardLink);
            button.put("style", "primary");

            return objectMapper.writeValueAsString(rootNode);
        } else {
            // Discord Payload
            ObjectNode rootNode = objectMapper.createObjectNode();
            rootNode.put("username", "FixIt Hub Alerts");
            rootNode.put("avatar_url", "https://raw.githubusercontent.com/VIJAYAPANDIANT/fixit-hub/main/frontend/public/logo.png");

            ArrayNode embeds = rootNode.putArray("embeds");
            ObjectNode embed = embeds.addObject();
            embed.put("title", alertTitle);
            embed.put("color", "CRITICAL".equals(issue.getSeverity().toString()) ? 15158332 : 15844367); // Red for critical, orange/yellow otherwise
            embed.put("url", dashboardLink);

            ArrayNode fields = embed.putArray("fields");
            fields.addObject().put("name", "Project").put("value", issue.getProject().getName()).put("inline", true);
            fields.addObject().put("name", "Severity").put("value", issue.getSeverity().toString()).put("inline", true);
            fields.addObject().put("name", "Occurrences").put("value", String.valueOf(issue.getOccurrencesCount())).put("inline", true);
            fields.addObject().put("name", "Details").put("value", issue.getTitle()).put("inline", false);
            fields.addObject().put("name", "Message").put("value", "```\n" + cleanMessage + "\n```").put("inline", false);

            embed.put("timestamp", Instant.now().toString());

            return objectMapper.writeValueAsString(rootNode);
        }
    }

    private WebhookResponse mapToResponse(Webhook webhook) {
        return new WebhookResponse(
                webhook.getId(),
                webhook.getProject().getId(),
                webhook.getName(),
                webhook.getUrl(),
                webhook.getType(),
                webhook.isActive(),
                webhook.getCreatedAt() != null ? webhook.getCreatedAt().toString() : LocalDateTime.now().toString()
        );
    }
}
