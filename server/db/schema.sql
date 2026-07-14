-- Redesigned Database Schema for FixIt

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    plan_type VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Errors table
CREATE TABLE IF NOT EXISTS errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of normalized text
    raw_text_redacted TEXT NOT NULL,
    language VARCHAR(50),
    framework VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for instant error cache lookups
CREATE INDEX IF NOT EXISTS idx_errors_hash ON errors(error_hash);

-- 3. Fixes table
CREATE TABLE IF NOT EXISTS fixes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id UUID REFERENCES errors(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    code_snippet TEXT NOT NULL,
    source_type VARCHAR(50) DEFAULT 'ai', -- 'community', 'ai', 'external'
    confidence_score INT DEFAULT 90,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    verified_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Composite index for fast ranked solution retrieval
CREATE INDEX IF NOT EXISTS idx_fixes_error_confidence ON fixes(error_id, confidence_score DESC);

-- 4. Votes table (deduplication of votes by user/IP)
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fix_id UUID REFERENCES fixes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of client IP
    vote_type VARCHAR(10) NOT NULL, -- 'up' or 'down'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_fix_ip_vote UNIQUE (fix_id, ip_hash)
);

-- 5. Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    plan_type VARCHAR(50) DEFAULT 'free',
    api_key VARCHAR(64) UNIQUE NOT NULL
);

-- 6. Team Error Logs table
CREATE TABLE IF NOT EXISTS team_error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    error_id UUID REFERENCES errors(id) ON DELETE CASCADE,
    resolved_boolean BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP
);
