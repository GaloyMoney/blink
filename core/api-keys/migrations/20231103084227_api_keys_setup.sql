CREATE TABLE identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id VARCHAR NOT NULL UNIQUE
);

CREATE TABLE identity_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID REFERENCES identities(id) NOT NULL,
  encrypted_key VARCHAR NOT NULL,
  active BOOL NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ NULL
);
