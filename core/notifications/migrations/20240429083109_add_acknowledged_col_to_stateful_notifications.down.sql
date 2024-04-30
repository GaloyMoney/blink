-- Add down migration script here
DROP INDEX idx_stateful_notifications_acknowledged;

ALTER TABLE stateful_notifications
DROP COLUMN acknowledged;
