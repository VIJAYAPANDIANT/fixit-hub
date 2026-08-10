-- =========================================================================
-- FLYWAY SCHEMA MIGRATION: V7__create_webhooks_schema.sql
-- TARGET DATABASE: PostgreSQL 15+
-- =========================================================================

CREATE TABLE webhooks (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL, -- SLACK, DISCORD
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_webhooks_project ON webhooks(project_id);
