-- backend/migrations/001_init.down.sql

DROP MATERIALIZED VIEW IF EXISTS daily_summary;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS users;
