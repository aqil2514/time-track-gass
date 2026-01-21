-- backend/migrations/002_seed_users.down.sql

DELETE FROM users WHERE email = 'pile@timetrack.local';
