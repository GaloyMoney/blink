-- Add up migration script here

ALTER TABLE stateful_notifications
ADD COLUMN acknowledged BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_stateful_notifications_acknowledged ON stateful_notifications (acknowledged);
