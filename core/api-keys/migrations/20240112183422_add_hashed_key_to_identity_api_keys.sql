ALTER TABLE identity_api_keys
ADD COLUMN hashed_key BYTEA UNIQUE DEFAULT gen_random_bytes(256);
