-- =========================================================================
-- FLYWAY SCHEMA MIGRATION: V6__create_scraped_fixes_schema.sql
-- TARGET DATABASE: PostgreSQL 15+
-- =========================================================================

CREATE TABLE scraped_fixes (
    id UUID PRIMARY KEY,
    error_id UUID REFERENCES errors(id) ON DELETE CASCADE NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_url VARCHAR(500) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_error_source_url UNIQUE (error_id, source_url)
);

CREATE INDEX idx_scraped_fixes_error ON scraped_fixes(error_id);
