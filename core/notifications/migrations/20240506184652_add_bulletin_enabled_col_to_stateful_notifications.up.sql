-- Add up migration script here

ALTER TABLE stateful_notifications
ADD COLUMN bulletin_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_stateful_notifications_bulletin_enabled ON stateful_notifications (bulletin_enabled);
