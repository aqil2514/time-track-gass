-- backend/migrations/004_seed_users.up.sql

-- Seed user: pile@timetrack.local
-- Password: Kerja123!
INSERT INTO users (email, password_hash, name)
VALUES (
    'pile@timetrack.local',
    '$2a$10$iP7lXez2srcHXFap3sgbYOLgbhRdZ9K9M0Pmqs8byDv9V.C.wor5m',
    'Pile User'
)
ON CONFLICT (email) DO NOTHING;
