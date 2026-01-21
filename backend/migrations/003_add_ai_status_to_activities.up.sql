-- backend/migrations/003_add_ai_status_to_activities.up.sql

-- Add AI status tracking to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS ai_status VARCHAR(20) DEFAULT 'success';
-- Possible values: 'success', 'queued', 'failed', 'processing'

-- Add retry queue reference (nullable, only for queued items)
ALTER TABLE activities ADD COLUMN IF NOT EXISTS retry_queue_id UUID REFERENCES retry_queue(id) ON DELETE SET NULL;

-- Index for querying queued items
CREATE INDEX IF NOT EXISTS idx_activities_ai_status ON activities (user_id, ai_status, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_retry_queue ON activities (retry_queue_id) WHERE retry_queue_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN activities.ai_status IS 'AI analysis status: success, queued, failed, processing';
COMMENT ON COLUMN activities.retry_queue_id IS 'Reference to retry_queue task if AI analysis is queued';
