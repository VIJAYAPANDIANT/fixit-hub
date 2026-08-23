# FixIt Hub 🛠️ (Universal Error & Bug Resolution Hub)

[![CI/CD Build & Test](https://github.com/VIJAYAPANDIANT/fixit-hub/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/VIJAYAPANDIANT/fixit-hub/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java Version](https://img.shields.io/badge/Java-21-blue.svg?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Go Version](https://img.shields.io/badge/Go-1.21-00ADD8.svg?logo=go&logoColor=white)](https://go.dev/)
[![Node.js Version](https://img.shields.io/badge/Node.js-20.x-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F.svg?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=white)](https://react.dev/)

An AI-powered, self-hosted, real-time error tracking and exception monitoring system designed to help developers capture, diagnose, and resolve application bugs instantly. FixIt Hub combines high-performance log ingestion, automated issue deduplication, Elasticsearch-powered search, and Google Gemini AI diagnostics to provide instant root-cause analysis and actionable resolution steps.

![FixIt Hub Dashboard](docs/images/dashboard.png)

## 📌 Table of Contents

* [✨ Key Features](#-key-features)
* [🌐 Live Deployments & Demo Credentials](#-live-deployments)
* [📖 Developer Documentation](#-developer-documentation)
* [🏗️ Architecture & Data Flow](#️-architecture--data-flow)
* [🗄️ Database Entity Relationship (ER) Diagram](#️-database-entity-relationship-er-diagram)
* [📂 Repository Layout](#-repository-layout)
* [🛠️ Technology Stack](#️-technology-stack)
* [⚙️ Environment Configuration](#️-environment-configuration)
* [🔔 Real-Time Webhook Alert Channels (Slack & Discord)](#-real-time-webhook-alert-channels-slack--discord)
* [☁️ Cloud Services & API Configuration Guides](#️-cloud-services--api-configuration-guides)
* [🚀 Running the Application](#-running-the-application)
* [🛡️ Security & Production Hardening](#️-security--production-hardening)
* [📊 Performance & Scaling Architecture](#-performance--scaling-architecture)
* [🔄 CI/CD Automation Pipeline](#-cicd-automation-pipeline)
* [🛠️ Client SDK Integration (DSN Setup)](#️-client-sdk-integration-dsn-setup)

---

## ✨ Key Features

- **⚡ High-Throughput Log Ingestion**: Lightweight Go daemon recording raw telemetry data directly to ClickHouse (columnar analytical storage) at sub-millisecond speeds.
- **🔍 Automated Deduplication**: Intelligent MD5 stacktrace fingerprinting that aggregates duplicate crash instances into unified, triageable issues.
- **🤖 LLM-Powered AI Diagnostics**: Instant Google Gemini AI integration analyzing error message contexts, trace files, and environment variables to formulate root-cause explanations and drop-in code fixes.
- **🔎 Elasticsearch Indexing**: Low-latency, full-text log search with advanced filtering capabilities (by language, severity, environment, and tags).
- **🔔 Slack & Discord Alerts**: Asynchronous background webhook alerts that ping external team chats immediately when new or re-opened crashes are logged.
- **📊 Interactive Developer Dashboard**: Sleek React 19 UI with visual trend graphs, theme toggles, comment threads, solution voting, bookmarks, and developer triage assignments.

---

## 🌐 Live Deployments
- **Frontend Dashboard**: [https://fixit-hub-api.vercel.app/](https://fixit-hub-api.vercel.app/)
- **Backend API (Spring Boot Core)**: [https://fixit-core-backend.onrender.com](https://fixit-core-backend.onrender.com)
- **Node.js Ingestion Worker**: [https://fixit-node-worker.onrender.com](https://fixit-node-worker.onrender.com)

### 🔑 Demo Credentials

For testing and evaluating the live dashboard, use the following credentials:

| Role | Email | Password |
| --- | --- | --- |
| **Global Admin** | `admin@fixit.hub` | `adminpassword` |
| **Developer** | `vijayapandian112007@gmail.com` | `123456` |

---

## 📖 Developer Documentation

To help developers onboard and contribute to FixIt Hub, the following technical guides are available:
- **[Developer Architecture Guide](file:///c:/Fixhub/docs/architecture.md)**: Details components topology and asynchronous queue processing.
- **[Database Layout & Schemas Guide](file:///c:/Fixhub/docs/database.md)**: Covers Flyway migrations, database constraints, and analytical ClickHouse structures.
- **[REST API Guide](file:///c:/Fixhub/docs/api-guide.md)**: Lists active endpoint paths, parameter schemas, and Slack/Discord payloads.
- **[Local Development Setup Guide](file:///c:/Fixhub/docs/setup-guide.md)**: Complete guide for setting up credentials, databases, and microservices.

---

## 🏗️ Architecture & Data Flow

FixIt Hub implements two distinct data paths to achieve maximum throughput for log events while maintaining high responsiveness for dashboard queries:

1. **High-Throughput Analytics & AI Diagnostics Path (Asynchronous)**:
   - **Ingestion**: Client SDKs target the Go Ingestion daemon on port `5001`. The daemon records raw exception payloads directly into **ClickHouse** for high-volume analytical queries.
   - **Processing**: Simultaneously, a deduplication task is enqueued onto a **Redis Queue (`queue:events`)**.
   - **Diagnostics**: A Node.js event worker pops tasks from the queue, generates issue deduplication fingerprints, invokes the **Google Gemini AI API** for root-cause analyses, and updates the core **PostgreSQL** metadata database.

2. **Direct Management REST Path (Synchronous)**:
   - **Core Backend**: Built on Spring Boot 3, providing JWT-based authentication, user permissions, issue lifecycle management, bookmarking, notifications, and settings.
   - **Search**: Fully integrates with **Elasticsearch** for low-latency, full-text log search.
   - **Cache**: Employs **Redis Cache** for frequently read dashboards and session lookups.

```mermaid
flowchart TD
    subgraph Client Applications
        SDK[Client SDK / App]
    end

    subgraph High-Throughput Ingestion Path
        IngestGo[Go Ingestion Service<br>Port 5001]
        CH[(ClickHouse<br>Event Storage)]
        RedisQ[(Redis Queue<br>queue:events)]
        WorkerNode[Node.js Event Worker<br>Port 5002 / Worker]
        Gemini[Google Gemini AI API]
    end

    subgraph Core Management Path
        BackendJava[Spring Boot Core Backend<br>Port 8080]
        ES[(Elasticsearch<br>Search Index)]
        PG[(PostgreSQL<br>Metadata DB)]
        RedisCache[(Redis Cache)]
    end

    subgraph Frontend Client
        FrontendReact[React Dashboard UI<br>Port 80 / 5173]
    end

    %% Ingestion Flow
    SDK -->|POST /api/v1/store/| IngestGo
    IngestGo -->|1. Store Raw Event| CH
    IngestGo -->|2. Enqueue Task| RedisQ
    RedisQ -->|3. Pop Task| WorkerNode
    WorkerNode -->|4. Request Diagnostics| Gemini
    WorkerNode -->|5. Update Metadata| PG

    %% Core Management Flow
    SDK -->|Fallback Ingestion /api/v1/store| BackendJava
    BackendJava -->|Sync / Cache| PG
    BackendJava -->|Cache Operations| RedisCache
    BackendJava -->|Full-Text Search| ES
    FrontendReact -->|Query & Admin Actions| BackendJava
```

---

## 🗄️ Database Entity Relationship (ER) Diagram

The transactional database (PostgreSQL 15+) maps entities related to users, organizations, projects, issue fingerprints, webhooks, and team triage feedback. Below is the relational structure of the database:

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ PROJECTS : "contains"
    ORGANIZATIONS {
        uuid id PK
        varchar name
        timestamp created_at
    }

    PROJECTS ||--o{ ERRORS : "tracks"
    PROJECTS ||--o{ WEBHOOKS : "triggers"
    PROJECTS {
        uuid id PK
        uuid org_id FK
        varchar name
        varchar dsn_key
        timestamp created_at
    }

    WEBHOOKS {
        uuid id PK
        uuid project_id FK
        varchar name
        varchar url
        varchar type
        boolean active
        timestamp created_at
    }

    USERS ||--o{ ERRORS : "assignee"
    USERS ||--o{ SOLUTIONS : "authors"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o{ BOOKMARKS : "creates"
    USERS ||--o{ VOTES : "casts"
    USERS ||--o{ SEARCH_HISTORY : "searches"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ ADMIN_LOGS : "logs"
    USERS ||--o{ REFRESH_TOKENS : "owns"
    USERS {
        uuid id PK
        varchar email
        varchar password_hash
        varchar name
        varchar role
        varchar status
        timestamp created_at
    }

    PROGRAMMING_LANGUAGES ||--o{ FRAMEWORKS : "extends"
    PROGRAMMING_LANGUAGES ||--o{ ERRORS : "categorizes"
    PROGRAMMING_LANGUAGES {
        int id PK
        varchar name
        varchar slug
        timestamp created_at
    }

    FRAMEWORKS ||--o{ ERRORS : "context"
    FRAMEWORKS {
        int id PK
        int language_id FK
        varchar name
        varchar slug
        timestamp created_at
    }

    CATEGORIES ||--o{ ERRORS : "classifies"
    CATEGORIES {
        int id PK
        varchar name
        varchar slug
        text description
        timestamp created_at
    }

    TAGS ||--o{ ERROR_TAGS : "describes"
    TAGS {
        int id PK
        varchar name
        varchar slug
    }

    ERROR_TAGS {
        uuid error_id PK
        int tag_id FK
    }

    ERRORS ||--o{ ERROR_TAGS : "tagged"
    ERRORS ||--o{ SOLUTIONS : "resolves"
    ERRORS ||--o{ AI_SOLUTIONS : "diagnoses"
    ERRORS ||--o{ COMMENTS : "discusses"
    ERRORS ||--o{ BOOKMARKS : "bookmarked"
    ERRORS ||--o{ SCRAPED_FIXES : "scrapes"
    ERRORS {
        uuid id PK
        uuid project_id FK
        varchar fingerprint
        text title
        text message
        text stacktrace
        varchar status
        varchar severity
        varchar difficulty
        int occurrences_count
        timestamp first_seen
        timestamp last_seen
    }

    SOLUTIONS ||--o{ VOTES : "receives"
    SOLUTIONS {
        uuid id PK
        uuid error_id FK
        uuid user_id FK
        text content
        int upvotes_count
        int downvotes_count
        boolean is_accepted
        timestamp created_at
    }

    AI_SOLUTIONS {
        uuid id PK
        uuid error_id FK
        varchar model_name
        text summary
        text root_cause
        text fix_suggestion
        numeric confidence_score
        timestamp created_at
    }

    COMMENTS {
        uuid id PK
        uuid error_id FK
        uuid user_id FK
        text content
        timestamp created_at
    }

    VOTES {
        uuid id PK
        uuid user_id FK
        uuid solution_id FK
        int vote_type
        timestamp created_at
    }

    BOOKMARKS {
        uuid id PK
        uuid user_id FK
        uuid error_id FK
        timestamp created_at
    }

    SCRAPED_FIXES {
        uuid id PK
        uuid error_id FK
        varchar source_name
        varchar source_url
        varchar title
        text content
        timestamp created_at
    }
```

> [!NOTE]
> **Decoupled Database Schema Design**: Tables managed by the Java Spring Boot backend (like `errors` and `webhooks`) do not enforce database-level foreign key constraints (`REFERENCES projects(id)`) against the `projects` table. This keeps the backend decoupled from tables initialized dynamically by the Node.js API, and allows Flyway migrations and test suites (H2) to run successfully in localized test/CI environments.

---

## 📂 Repository Layout

This repository is organized as a monorepo containing multiple key workspaces and service layers:

- **[frontend/](file:///c:/Fixhub/frontend)**: A React-based SPA dashboard built with React 19, Vite, TypeScript, and TailwindCSS v4.
- **[backend/](file:///c:/Fixhub/backend)**: The core management service built with Spring Boot 3, Java 21, Spring Security (JWT), and Flyway database migrations.
- **[apps/ingestion/](file:///c:/Fixhub/apps/ingestion)**: A lightweight, high-performance Go ingestion daemon that records raw exception logs to ClickHouse and publishes job messages to Redis.
- **[apps/api/](file:///c:/Fixhub/apps/api)**: Node.js worker and API container responsible for processing enqueued ingestion jobs, calculating issue deduplication fingerprints, and invoking Gemini AI for root-cause analyses.
- **[docker-compose.yml](file:///c:/Fixhub/docker-compose.yml)**: Configures and spins up the multi-container Docker stack including PostgreSQL, Redis, Elasticsearch, the Java backend, and the React frontend.
- **[.github/workflows/ci-cd.yml](file:///c:/Fixhub/.github/workflows/ci-cd.yml)**: The automated CI/CD pipeline definition for test execution, compilation validation, container compilation, security scans, and package distribution.

---

## 🛠️ Technology Stack

| Component | Technology | Primary Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS v4, TanStack Query, Lucide Icons | User & Admin Dashboard |
| **Backend** | Spring Boot 3, Java 21, Spring Security, Flyway, JPA / Hibernate | Management API, Full-Text Search, Auth |
| **Ingestion** | Go 1.21 | High-throughput Log Ingest |
| **Worker** | Node.js, Express, TypeScript, Google Generative AI SDK | Queue Processor & AI Diagnostics Integration |
| **Datastores** | PostgreSQL 15, Redis 7, ClickHouse, Elasticsearch 8 | Transactional Metadata, Queues/Cache, Event Analytics, Log Search |

---

## ⚙️ Environment Configuration

Define a `.env` file at the root of the workspace. A template is provided in [.env](file:///c:/Fixhub/.env):

### Core Application Configuration

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | Spring Boot Core Service Port | `8080` |
| `DB_HOST` | PostgreSQL Host Address | `postgres` (or `localhost` for local run) |
| `DB_PORT` | PostgreSQL Service Port | `5432` |
| `DB_NAME` | Metadata Database Name | `fixit_metadata` |
| `DB_USER` | PostgreSQL Username | `postgres` |
| `DB_PASSWORD` | PostgreSQL Password | `postgrespassword` |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://postgres:postgrespassword@localhost:5432/fixit_metadata` |
| `REDIS_HOST` | Redis Server Hostname | `redis` (or `localhost` for local run) |
| `REDIS_PORT` | Redis Server Port | `6379` |
| `REDIS_URL` | Redis Server Connection URL | `redis://localhost:6379` |

### Integrations & Services Configuration

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `ELASTICSEARCH_URIS` | Elasticsearch URI Connection String | `http://elasticsearch:9200` |
| `CLICKHOUSE_URL` | ClickHouse Endpoint Hostname | `http://localhost:8123` |
| `CLICKHOUSE_DB` | ClickHouse Database Name | `fixit_events` |
| `JWT_SECRET` | Secret key for generating JSON Web Tokens | `dGhpcy1pcy1hLXNlY3JldC1rZXktZm9yLWZpeGl0LWh1Yi1iYWNrZW5kLXByb2R1Y3Rpb24tc3VpdGUtbXVzdC1iZS0yNTYtYml0cw==` |
| `JWT_EXPIRATION_MS` | JWT validity duration (defaults to 24 Hours) | `86400000` |
| `GEMINI_API_KEY` | API key for Google Generative AI | *(Empty)* |
| `GEMINI_MODEL` | Gemini AI model version used for diagnostics | `gemini-1.5-flash` |
| `INGESTION_URL` | Ingest server target address for local routing | `http://localhost:5001` |
| `FRONTEND_URL` | Origin path configuration for cross-origin security | `https://fixit-hub-api.vercel.app` |
| `VITE_API_URL` | Environment Variable passed to Web UI | `http://localhost:5002/api` |

---

## 🔔 Real-Time Webhook Alert Channels (Slack & Discord)

FixIt Hub natively supports real-time notifications to external workspace teams. Alert configurations are managed per-project and are dispatched asynchronously to protect the log ingestion loop from remote latency spikes.

### Webhook API Endpoints
All webhook endpoints require Bearer Token Authentication and validation of a valid Project ID.

- **List Project Webhooks**: `GET /api/projects/{projectId}/webhooks`
- **Register Webhook**: `POST /api/projects/{projectId}/webhooks`
- **Update Webhook**: `PUT /api/projects/{projectId}/webhooks/{webhookId}`
- **Delete Webhook**: `DELETE /api/projects/{projectId}/webhooks/{webhookId}`
- **Send Test Connection Ping**: `POST /api/projects/{projectId}/webhooks/{webhookId}/test`

### UI Dashboard Configuration
Users can manage integrations directly from the **Settings Dashboard**:
1. Select the active Project using the nav drop-down.
2. Navigate to **Settings** -> **Real-Time Webhook Alert Channels**.
3. Create channels (defining Name, Target type: `Slack` or `Discord`, and the Webhook URL).
4. Click the **Play** button to dispatch a connection check alert verifying endpoint routing.
5. Toggle the active status switch to temporarily enable or disable alert processing.

---

## ☁️ Cloud Services & API Configuration Guides

### 🐘 1. Provisioning Neon Serverless PostgreSQL
FixIt Hub supports serverless PostgreSQL databases provided by **[Neon](https://neon.tech/)**:
1. Log in to Neon and click **Create Project**. Name it `Fixhub` and select your target region.
2. In the Neon Console, locate the **Connection String** dropdown box.
3. Toggle the **Connection Pooling** switch active (uses Neon's transaction pooler).
4. Copy the connection string (starts with `postgresql://`).
5. Map the connection parameters in your local `.env` file:
   - **`DATABASE_URL`**: `postgresql://neondb_owner:<pwd>@<host>/neondb?sslmode=require&channel_binding=require`
   - **`SPRING_DATASOURCE_URL`**: `jdbc:postgresql://<host>/neondb?sslmode=require`

---

### 🤖 2. Generating Google Gemini API Keys
The automated diagnostics worker relies on Google's LLM engine:
1. Log in to **[Google AI Studio](https://aistudio.google.com/)**.
2. Click on the **Get API key** button in the left navigation sidebar.
3. Click **Create API key** (select a new Google Cloud project or bind to an existing one).
4. Copy the generated API key (starts with `AIzaSy`).
5. Paste it next to `GEMINI_API_KEY` in your `.env` file.

---

## 🚀 Running the Application

### 🐳 1. Using Docker Compose (Recommended)

To spin up all services together, run the following command at the workspace root:

```bash
docker-compose up --build -d
```

This brings up:
- **PostgreSQL** on `5432`
- **Redis** on `6379`
- **Elasticsearch** on `9200`
- **Spring Boot Backend** on `8080` (API documentation accessible at `http://localhost:8080/swagger-ui.html`)
- **React Frontend** on `80` (Dashboard accessible at `http://localhost`)

> [!TIP]
> **Monorepo Containerization Strategy**: In our monorepo setup, `package-lock.json` is located exclusively at the root directory level. Sub-workspaces (like `/frontend`) compile their Docker images using only `package.json` and install dependencies using `npm install --legacy-peer-deps` to ensure Docker compilation succeeds without localized lock files.

---

### 💻 2. Local Development Setup

If running components locally for development:

#### **Step A: Launch Datastores**
Launch PostgreSQL, Redis, ClickHouse, and Elasticsearch locally or run only the datastore containers via Docker:
```bash
docker-compose up -d postgres redis elasticsearch
```

#### **Step B: Ingestion Service (Go)**
1. Navigate to the ingestion directory:
   ```bash
   cd apps/ingestion
   ```
2. Build and run using:
   ```bash
   go run main.go
   ```

#### **Step C: Event Worker & API (Node.js)**
From the root directory, install all monorepo dependencies and start the dev process for the API/worker:
```bash
npm run install:all
npm run dev:api
```

#### **Step D: Core Backend (Spring Boot)**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Launch using Maven:
   ```bash
   mvn spring-boot:run
   ```

#### **Step E: Frontend Dashboard (Vite + React)**
From the root directory, start the Vite development server:
```bash
npm run dev:web
```
The client dashboard will be available at `http://localhost:5173`.

---

## ☁️ Cloud Deployment Guide

### 🖤 1. Deploying Frontend to Vercel
1. Connect your GitHub repository `VIJAYAPANDIANT/fixit-hub` to **[Vercel](https://vercel.com/)**.
2. Select **Root Directory** as `./frontend` (or root with Framework Preset: **Vite**).
3. Set the Environment Variable under Project Settings:
   - **`VITE_API_URL`**: `https://your-backend-service.onrender.com/api` (or your live backend API URL).
4. Click **Deploy**. Vercel will automatically build and publish your SPA.

---

### 🟣 2. Deploying Spring Boot / Docker Backend to Render
1. Log in to **[Render.com](https://render.com/)** and click **New +** → **Web Service**.
2. Connect your GitHub repository `VIJAYAPANDIANT/fixit-hub`.
3. Set **Root Directory** to `backend` and select runtime **Docker**.
4. Configure Database Environment Variables (e.g., using [Neon PostgreSQL](https://neon.tech/)):
   - **`SPRING_DATASOURCE_URL`**: `jdbc:postgresql://ep-xxxx.aws.neon.tech/neondb?sslmode=require`
   - **`SPRING_DATASOURCE_USERNAME`**: `neondb_owner`
   - **`SPRING_DATASOURCE_PASSWORD`**: `your-neon-password`
5. Click **Create Web Service**. Render will automatically build the Docker container and keep your Spring Boot service running continuously.

---

## 🛡️ Security & Production Hardening

To ensure a secure deployment in production environments, implement the following best practices:

*   **JWT Secret Key Rotation**: Avoid using the default `JWT_SECRET` in `.env`. Generate a secure 256-bit key using openssl:
    ```bash
    openssl rand -base64 32
    ```
    Configure this key in the environment variables of your hosting provider (e.g., Render, Vercel).
*   **Database Credentials Isolation**: Never commit actual database credentials or connection strings to git. Use environment variable injection (`DB_PASSWORD`, `DATABASE_URL`) to pass secrets dynamically.
*   **CORS Configuration Limits**: Limit permitted cross-origin requests to your designated frontend domain inside `SecurityConfig.java` rather than allowing wildcard origins (`*`).
*   **Spring Security Filter Auditing**: Ensure default management endpoints `/actuator/**` are protected or disabled in production by overriding properties:
    ```properties
    management.endpoints.web.exposure.exclude=*
    ```

---

## 📊 Performance & Scaling Architecture

FixIt Hub is architected to scale linearly to handle high crash velocities and massive ingestion spikes:

*   **Columnar Analytical Ingestion (ClickHouse)**: Raw exception logs are written to ClickHouse, allowing sub-second analytical aggregations across millions of rows without blocking transactional databases.
*   **Redis Queue Buffering**: Go ingestion daemons publish event tasks directly to Redis memory queues. This decouples client logging latency from slow Gemini LLM diagnostic calls.
*   **Hibernate Connection Pool Tuning**: Configure HikariCP parameters for your Spring Boot service to match database capacity limits. For instance, on serverless Neon Postgres, enable transaction connection pooling:
    ```properties
    spring.datasource.hikari.maximum-pool-size=10
    spring.datasource.hikari.minimum-idle=2
    ```
*   **JVM Memory Allocation**: For memory-constrained hosting environments (such as Render's free tier), configure JVM garbage collection and heap boundaries:
    ```bash
    java -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -jar app.jar
    ```

---

## 🔄 CI/CD Automation Pipeline

The repository includes a GitHub Actions workflow configured in [.github/workflows/ci-cd.yml](file:///c:/Fixhub/.github/workflows/ci-cd.yml):

- **Automated Testing**: Executes frontend unit tests with Vitest on every `git push`.
- **Build Verification**: Validates TypeScript compilation and Maven packaging for backend code.
- **Container Registry Sync**: Builds Docker images for frontend and backend and publishes them to GitHub Container Registry (`ghcr.io`).
- **Security Scanning**: Scans container images for vulnerabilities using Trivy.

---

## 🛠️ Client SDK Integration (DSN Setup)

To start tracking exceptions and bugs from your client applications in production, integrate the FixIt SDK and point the DSN target to your deployed Node.js Ingestion Worker on Render:

```javascript
import FixIt from 'fixit-sdk';

FixIt.init({
  // Streams log payloads directly to your live ingestion worker
  dsn: "https://fixit-node-worker.onrender.com/api/v1/store"
});
```

For more details, see the template in [client-example.js](file:///c:/Fixhub/client-example.js).
