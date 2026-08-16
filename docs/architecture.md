# FixIt Hub - Developer Architecture Guide

This document describes the architectural layout, components, and data flows of FixIt Hub.

---

## 🏗️ System Components Topology

FixIt Hub operates on a dual-path pipeline designed to separate high-throughput ingestion operations from synchronous administrative queries:

```
                  +-----------------------------------+
                  |        Client Application         |
                  +-----------------------------------+
                                    |
            +-----------------------+-----------------------+
            | (High-Throughput Path)                        | (Fallback / Direct REST)
            v                                               v
+-----------------------+                       +-----------------------+
|  Go Ingest (Port 5001)|                       | Spring Boot (Port 8080|
+-----------------------+                       +-----------------------+
      |               |                                     |
      | (Raw Event)   | (Deduplication task)                | (Hibernate Validation)
      v               v                                     v
+-------------+ +-------------+                 +-----------------------+
|  ClickHouse | | Redis Queue |                 |      PostgreSQL       |
+-------------+ +-------------+                 +-----------------------+
                      |                                     |
                      v (Pop Task)                          |
                +-------------+                             |
                | Node Worker |-----------------------------+
                +-------------+ (Update Status / Deduplicate)
                      |
                      v (LLM Diagnostics)
                +-------------+
                |  Gemini AI  |
                +-------------+
```

---

## 🔄 Ingestion & Analytics Pipeline (Asynchronous Path)

1. **Log Dispatch**: The client-side SDK dispatches raw crash/exception payloads to the Go Ingestion microservice (`apps/ingestion/`) listening on port `5001`.
2. **Columnar Log Storage**: The Go daemon writes the raw telemetry details directly into a **ClickHouse** cluster, allowing high-performance aggregation queries over billions of rows.
3. **Queue Publishing**: Simultaneously, the Go daemon publishes a lightweight task object containing the event hash, project context, and payload reference to the **Redis Queue (`queue:events`)**.
4. **Queue Consumer**: The Node.js Express server (`apps/api/`) acts as the queue consumer, popping tasks sequentially:
   - Evaluates the MD5 signature fingerprint.
   - Saves or increments the occurrence log in the **PostgreSQL** metadata store.
   - Triggers the **Google Gemini AI SDK** to perform automated root-cause analysis and compile repair recommendations if a new fingerprint is identified.

---

## 🔐 Administrative & Dashboard Path (Synchronous Path)

1. **Auth & Security**: The React dashboard communicates with the Spring Boot application (port `8080`) using JWT Bearer authentication.
2. **Search Indexing**: The Spring Boot backend maps database metadata records directly to an **Elasticsearch** cluster, supporting full-text search over error messages, trace logs, and descriptions.
3. **Triage Operations**: Core developer actions (status updates, comments, webhook triggers, solution votes) are handled synchronously by Spring Boot and stored in PostgreSQL.
4. **Caching Layer**: Redis Cache is used to store high-traffic statistics (e.g. project list aggregates and activity grids).
