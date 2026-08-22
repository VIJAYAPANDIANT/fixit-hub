-- =========================================================================
-- FLYWAY SCHEMA MIGRATION: V9__add_assigned_to_to_errors.sql
-- TARGET DATABASE: PostgreSQL 15+
-- =========================================================================

-- Add assigned_to column to errors table referencing users
ALTER TABLE errors ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
