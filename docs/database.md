# FixIt Hub - Database Layout & Schemas Guide

This document describes the schema management, data models, and decoupling strategy used in the FixIt Hub database engine.

---

## 🗄️ Relational Schema (PostgreSQL)

The primary relational data store is **PostgreSQL 15+**. It holds the canonical metadata for issues, user configurations, comments, resolutions, and system audit logs.

### Schema Management
Database migrations are managed via **Flyway** (`backend/src/main/resources/db/migration/`). 

### Decoupled Schema Design
To prevent system-level blocking and support test suites running in isolated environments (such as H2 in-memory test databases):
- The `organizations` and `projects` tables are created and managed dynamically by the Node.js service (`apps/api/src/server.ts`).
- Tables managed by Flyway and the Spring Boot backend (like `errors` and `webhooks`) do not enforce physical database-level foreign key constraints (`REFERENCES projects(id)`) against the `projects` table.
- Relationships are maintained logically within the JPA application layer:
  ```java
  // In Webhook.java (JPA maintains the entity relationship)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;
  ```

---

## 📊 Analytical Schema (ClickHouse)

Raw exception logs are stored in **ClickHouse** to support real-time high-throughput telemetry analytics.

- **Table**: `events`
- **Engine**: `MergeTree()` ordered by project ID and event timestamp.
- **Fields**:
  - `id`: Event UUID
  - `project_id`: Project UUID
  - `timestamp`: Event DateTime
  - `environment`: String (production, staging, development)
  - `exception_type`: String (e.g. `NullPointerException`)
  - `exception_message`: String
  - `stacktrace`: String
  - `tags`: Map(String, String)
