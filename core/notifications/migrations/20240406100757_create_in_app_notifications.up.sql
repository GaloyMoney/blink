-- Add up migration script here

CREATE TABLE in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  galoy_user_id VARCHAR NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  deep_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

