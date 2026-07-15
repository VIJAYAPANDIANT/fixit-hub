-- =========================================================================
-- FLYWAY SCHEMA MIGRATION: V4__extend_errors_schema.sql
-- TARGET DATABASE: PostgreSQL 15+
-- =========================================================================

-- Extend errors table with advanced error management columns
ALTER TABLE errors 
ADD COLUMN description TEXT,
ADD COLUMN root_cause TEXT,
ADD COLUMN verified_fix TEXT,
ADD COLUMN code_snippet TEXT,
ADD COLUMN difficulty VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL,
ADD COLUMN popularity INT DEFAULT 0 NOT NULL,
ADD COLUMN views INT DEFAULT 0 NOT NULL,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Add check constraint for difficulty bounds
ALTER TABLE errors
ADD CONSTRAINT check_error_difficulty CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD'));

-- Create trigger to manage updated_at on modifications
CREATE TRIGGER update_errors_updated_at
BEFORE UPDATE ON errors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Re-create text search indexing to cover the description field as well
DROP INDEX IF EXISTS idx_errors_fulltext;
CREATE INDEX idx_errors_fulltext ON errors USING gin(to_tsvector('english', title || ' ' || COALESCE(message, '') || ' ' || COALESCE(description, '')));
