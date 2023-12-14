ALTER TABLE identity_api_keys
ADD COLUMN read_only BOOL NOT NULL DEFAULT false;
