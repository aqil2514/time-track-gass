-- backend/migrations/001_init.up.sql

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table (will be converted to hypertable)
CREATE TABLE activities (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ NOT NULL,
    app_name VARCHAR(100),
    window_title VARCHAR(500),
    category VARCHAR(50),
    summary VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, captured_at)
);

-- Convert to hypertable
SELECT create_hypertable('activities', 'captured_at',
    chunk_time_interval => INTERVAL '1 week'
);

-- Enable compression
ALTER TABLE activities SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'user_id',
    timescaledb.compress_orderby = 'captured_at DESC'
);

-- Add compression policy (compress chunks older than 1 month)
SELECT add_compression_policy('activities', INTERVAL '1 month');

-- Add retention policy (delete data older than 1 year)
SELECT add_retention_policy('activities', INTERVAL '1 year');

-- Shares table
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id, viewer_id)
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared Links
CREATE TABLE shared_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(100),
    expires_at      TIMESTAMPTZ,
    is_public       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    views           INT DEFAULT 0
);

-- Indexes
CREATE INDEX idx_activities_user ON activities (user_id, captured_at DESC);
CREATE INDEX idx_activities_category ON activities (user_id, category);
CREATE INDEX idx_shares_owner ON shares (owner_id);
CREATE INDEX idx_shares_viewer ON shares (viewer_id);
CREATE INDEX idx_shared_links_user ON shared_links (user_id);
CREATE INDEX idx_shared_links_slug ON shared_links (slug);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);
CREATE INDEX idx_sessions_token ON sessions (token);

-- Continuous Aggregate for daily summary
CREATE MATERIALIZED VIEW daily_summary
WITH (timescaledb.continuous) AS
SELECT
    user_id,
    time_bucket('1 day', captured_at) AS day,
    category,
    COUNT(*) as activity_count,
    COUNT(*) * 5 as total_minutes
FROM activities
GROUP BY user_id, day, category;

-- Add refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('daily_summary',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);
