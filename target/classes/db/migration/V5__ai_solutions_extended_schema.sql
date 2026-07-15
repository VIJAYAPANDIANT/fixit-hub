-- =========================================================================
-- FLYWAY SCHEMA MIGRATION: V5__ai_solutions_extended_schema.sql
-- TARGET DATABASE: PostgreSQL 15+
-- =========================================================================

-- Extend ai_solutions table with fields for advanced AI suggestion features
ALTER TABLE ai_solutions ADD COLUMN title TEXT;
ALTER TABLE ai_solutions ADD COLUMN explanation TEXT;
ALTER TABLE ai_solutions ADD COLUMN fix_steps TEXT;
ALTER TABLE ai_solutions ADD COLUMN improved_code TEXT;
ALTER TABLE ai_solutions ADD COLUMN best_practices TEXT;
