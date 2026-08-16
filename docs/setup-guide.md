# FixIt Hub - Local Development Setup Guide

This document describes the environment parameters, local developer tools, and compilation instructions for running FixIt Hub locally.

---

## ⚙️ Environment Variables Config (.env)

Duplicate [.env.example](file:///c:/Fixhub/.env.example) and name it `.env` at the root directory of your workspace.

```ini
# Spring Boot Port configuration
PORT=8080

# PostgreSQL credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fixit_metadata
DB_USER=postgres
DB_PASSWORD=postgrespassword
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/fixit_metadata

# Redis credentials
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# Elasticsearch endpoint
ELASTICSEARCH_URIS=http://localhost:9200

# ClickHouse credentials
CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DB=fixit_events

# Google Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🐳 1. Multi-Container Orchestration (Docker Compose)

To launch the full container stack (PostgreSQL, Redis, ClickHouse, Elasticsearch, Java Backend, and React Frontend) inside Docker, run from the root directory:

```bash
docker-compose up --build -d
```

---

## 💻 2. Individual Component Development Setup

If running components locally outside Docker containers:

### Step A: Spin Up Datastores
Spin up PostgreSQL, Redis, ClickHouse, and Elasticsearch by launching only the datastore containers:
```bash
docker-compose up -d postgres redis elasticsearch
```

### Step B: Ingestion Microservice (Go)
1. Navigate to the ingestion directory:
   ```bash
   cd apps/ingestion
   ```
2. Build and run using:
   ```bash
   go run main.go
   ```

### Step C: Event Worker & API (Node.js)
From the root directory, install monorepo workspace dependencies and run:
```bash
npm run install:all
npm run dev:api
```

### Step D: Spring Boot Core Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Launch using Maven:
   ```bash
   mvn spring-boot:run
   ```

### Step E: React Dashboard Frontend
From the root directory, run the Vite development server:
```bash
npm run dev:web
```
Access the dashboard locally at `http://localhost:5173`.
