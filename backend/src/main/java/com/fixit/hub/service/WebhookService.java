package com.fixit.hub.service;

import com.fixit.hub.domain.entity.Issue;
import com.fixit.hub.dto.WebhookRequest;
import com.fixit.hub.dto.WebhookResponse;

import java.util.List;
import java.util.UUID;

public interface WebhookService {
    List<WebhookResponse> getProjectWebhooks(UUID projectId);
    WebhookResponse createWebhook(UUID projectId, WebhookRequest request);
    WebhookResponse updateWebhook(UUID webhookId, WebhookRequest request);
    void deleteWebhook(UUID webhookId);
    void testWebhook(UUID webhookId);
    void triggerWebhooksForIssue(Issue issue, boolean isNewIssue);
}
