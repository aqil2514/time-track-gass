-- Retry queue for failed AI analysis
CREATE TABLE IF NOT EXISTS retry_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(50) NOT NULL, -- 'screenshot_analysis', 'session_summary', 'daily_summary'
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'success', 'dead'
    attempt INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    error_message TEXT,
    next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_retry_queue_status_pending ON retry_queue (status, next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_retry_queue_task_type ON retry_queue (task_type, status);
CREATE INDEX IF NOT EXISTS idx_retry_queue_created_at ON retry_queue (created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_retry_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_retry_queue_updated_at ON retry_queue;
CREATE TRIGGER trigger_retry_queue_updated_at
    BEFORE UPDATE ON retry_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_retry_queue_updated_at();

-- Dead letter cleanup function (30 day retention)
CREATE OR REPLACE FUNCTION cleanup_dead_letters()
RETURNS void AS $$
BEGIN
    DELETE FROM retry_queue
    WHERE status = 'dead'
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
