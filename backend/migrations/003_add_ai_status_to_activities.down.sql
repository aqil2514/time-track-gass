-- backend/migrations/003_add_ai_status_to_activities.down.sql

-- Drop indexes
DROP INDEX IF EXISTS idx_activities_retry_queue;
DROP INDEX IF EXISTS idx_activities_ai_status;

-- Remove comments
COMMENT ON COLUMN activities.retry_queue_id IS NULL;
COMMENT ON COLUMN activities.ai_status IS NULL;

-- Drop columns (reverse order of creation)
ALTER TABLE activities DROP COLUMN IF EXISTS retry_queue_id;
ALTER TABLE activities DROP COLUMN IF EXISTS ai_status;
