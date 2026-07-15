-- =========================================================================
-- FLYWAY SCHEMA MIGRATION: V1__init_schema.sql
-- TARGET DATABASE: PostgreSQL 15+
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- DATABASE FUNCTIONS & TRIGGERS FOR TIMESTAMP TRACKING
-- =========================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================================
-- Lookup & Identity Tables
-- =========================================================================

-- Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    role_id INT REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_user_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'))
);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- Taxonomy & Context
-- =========================================================================

-- Programming Languages
CREATE TABLE programming_languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Frameworks
CREATE TABLE frameworks (
    id SERIAL PRIMARY KEY,
    language_id INT REFERENCES programming_languages(id) ON DELETE CASCADE,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tags
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL
);

-- =========================================================================
-- Core Error Tracking
-- =========================================================================

-- Errors / Issues
CREATE TABLE errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL, -- Logical link to active project workspace
    fingerprint VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    stacktrace TEXT,
    environment VARCHAR(50) DEFAULT 'production' NOT NULL,
    release_version VARCHAR(100) DEFAULT 'unknown' NOT NULL,
    language_id INT REFERENCES programming_languages(id) ON DELETE SET NULL,
    framework_id INT REFERENCES frameworks(id) ON DELETE SET NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Reported by
    status VARCHAR(20) DEFAULT 'UNRESOLVED' NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM' NOT NULL,
    occurrences_count INT DEFAULT 1 NOT NULL,
    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_project_fingerprint UNIQUE(project_id, fingerprint),
    CONSTRAINT check_error_status CHECK (status IN ('UNRESOLVED', 'RESOLVED', 'INVESTIGATING', 'SILENCED')),
    CONSTRAINT check_error_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- Error Tags (Many-to-Many Join)
CREATE TABLE error_tags (
    error_id UUID REFERENCES errors(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (error_id, tag_id)
);

-- =========================================================================
-- Resolutions & Collaboration
-- =========================================================================

-- Solutions
CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id UUID REFERENCES errors(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Author
    content TEXT NOT NULL,
    upvotes_count INT DEFAULT 0 NOT NULL,
    downvotes_count INT DEFAULT 0 NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_solutions_updated_at
BEFORE UPDATE ON solutions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- AI Diagnostics (1-to-1 Link)
CREATE TABLE ai_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id UUID REFERENCES errors(id) ON DELETE CASCADE UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    fix_suggestion TEXT NOT NULL,
    confidence_score NUMERIC(3, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_confidence CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0)
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id UUID REFERENCES errors(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Votes (Unique vote enforcement)
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE NOT NULL,
    vote_type INT NOT NULL, -- 1 = Upvote, -1 = Downvote
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_solution_vote UNIQUE(user_id, solution_id),
    CONSTRAINT check_vote_type CHECK (vote_type IN (1, -1))
);

-- Bookmarks
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    error_id UUID REFERENCES errors(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_user_error_bookmark UNIQUE(user_id, error_id)
);

-- =========================================================================
-- Activity, Auditing, & Alerts
-- =========================================================================

-- Search History
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    query_text TEXT NOT NULL,
    filters JSONB, -- stores severity, status, languages filters applied
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT check_notification_type CHECK (type IN ('ERROR_SPIKE', 'ASSIGNED', 'NEW_COMMENT', 'NEW_SOLUTION'))
);

-- Admin Logs (Security Audit Trail)
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================
-- PERFORMANCE TUNING INDEXES
-- =========================================================================

-- Foreign Key indexing to prevent nested loop table scans on joins
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_frameworks_language ON frameworks(language_id);
CREATE INDEX idx_errors_language ON errors(language_id);
CREATE INDEX idx_errors_framework ON errors(framework_id);
CREATE INDEX idx_errors_category ON errors(category_id);
CREATE INDEX idx_errors_user ON errors(user_id);
CREATE INDEX idx_errors_project ON errors(project_id);
CREATE INDEX idx_solutions_error ON solutions(error_id);
CREATE INDEX idx_solutions_user ON solutions(user_id);
CREATE INDEX idx_comments_error ON comments(error_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_votes_solution ON votes(solution_id);
CREATE INDEX idx_bookmarks_error ON bookmarks(error_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_admin_logs_admin ON admin_logs(admin_id);

-- Composite indices for typical dashboard filtering configurations
CREATE INDEX idx_errors_search_composite ON errors(environment, status, severity);

-- GIN Index for rapid full-text searching across crash summaries and descriptions
CREATE INDEX idx_errors_fulltext ON errors USING gin(to_tsvector('english', title || ' ' || COALESCE(message, '')));
