CREATE TABLE persistent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    galoy_user_id VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_persistent_notifications_galoy_user_id ON persistent_notifications (galoy_user_id);

CREATE TABLE persistent_notification_events (
  id UUID REFERENCES persistent_notifications(id) NOT NULL,
  sequence INT NOT NULL,
  event_type VARCHAR NOT NULL,
  event JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id, sequence)
);
