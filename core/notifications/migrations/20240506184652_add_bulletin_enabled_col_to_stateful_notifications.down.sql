-- Add down migration script here
DROP INDEX idx_stateful_notifications_bulletin_enabled;

ALTER TABLE stateful_notifications
DROP COLUMN bulletin_enabled;
