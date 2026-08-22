-- =========================================================================
-- FLYWAY SCHEMA MIGRATION: V8__add_ai_analysis_to_errors.sql
-- TARGET DATABASE: PostgreSQL 15+
-- =========================================================================

-- Add ai_analysis column to errors table
ALTER TABLE errors ADD COLUMN ai_analysis TEXT;
