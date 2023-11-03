CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE identity_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID REFERENCES identities(id) NOT NULL,
  name VARCHAR NOT NULL,
  last_used_at TIMESTAMPTZ,
  encrypted_key VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOL NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ
);
