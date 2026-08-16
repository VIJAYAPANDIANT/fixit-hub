# FixIt Hub - REST API Developers Guide

This document describes the core API endpoints, authorization protocols, and webhook alert formats.

---

## 🔐 Authentication & Security

All management endpoints require **JSON Web Token (JWT)** authorization. Pass the token inside the HTTP `Authorization` request header:

```http
Authorization: Bearer <your_jwt_token>
```

---

## 🔔 Slack & Discord Webhooks Integration API

Webhook alert channels are registered per-project. Payload deliveries are executed asynchronously to protect event ingestion latency.

### 1. List Registered Webhooks
- **Method & Path**: `GET /api/projects/{projectId}/webhooks`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK):
  ```json
  [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "projectId": "987fc876-1234-abcd-9988-ef1234567890",
      "name": "Dev Slack Channel",
      "url": "https://hooks.slack.com/services/...",
      "type": "SLACK",
      "active": true,
      "createdAt": "2026-08-15T14:00:00Z"
    }
  ]
  ```

### 2. Register a Webhook Channel
- **Method & Path**: `POST /api/projects/{projectId}/webhooks`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Production Discord Alerts",
    "url": "https://discord.com/api/webhooks/...",
    "type": "DISCORD",
    "active": true
  }
  ```
- **Response** (211 Created):
  ```json
  {
    "id": "234e5678-f89b-12d3-a456-426614174111",
    "projectId": "987fc876-1234-abcd-9988-ef1234567890",
    "name": "Production Discord Alerts",
    "url": "https://discord.com/api/webhooks/...",
    "type": "DISCORD",
    "active": true,
    "createdAt": "2026-08-15T14:10:00Z"
  }
  ```

### 3. Send Connection Test Ping
- **Method & Path**: `POST /api/projects/{projectId}/webhooks/{webhookId}/test`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK):
  ```json
  {
    "message": "Test webhook request dispatched successfully."
  }
  ```

### 4. Delete Webhook Configuration
- **Method & Path**: `DELETE /api/projects/{projectId}/webhooks/{webhookId}`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200 OK):
  ```json
  {
    "message": "Webhook deleted successfully."
  }
  ```
