-- backend/migrations/002_add_retry_queue.down.sql

-- Drop retry queue table
DROP TABLE IF EXISTS retry_queue CASCADE;

-- Drop cleanup function
DROP FUNCTION IF EXISTS cleanup_dead_letters();
