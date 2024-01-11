CREATE TABLE account_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    galoy_account_id VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE account_notification_settings_events (
  id UUID REFERENCES account_notification_settings(id) NOT NULL,
  sequence INT NOT NULL,
  event_type VARCHAR NOT NULL,
  event JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(id, sequence)
);
