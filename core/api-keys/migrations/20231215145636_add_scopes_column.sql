ALTER TABLE identity_api_keys
ADD COLUMN scopes VARCHAR[] NOT NULL DEFAULT ARRAY['read'];

UPDATE identity_api_keys
SET scopes = ARRAY['read', 'write']
WHERE read_only = false;

ALTER TABLE identity_api_keys
ALTER COLUMN scopes DROP DEFAULT;

ALTER TABLE identity_api_keys
DROP COLUMN read_only;
