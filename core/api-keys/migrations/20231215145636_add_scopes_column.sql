ALTER TABLE identity_api_keys
ADD COLUMN scopes VARCHAR[] NOT NULL;
UPDATE identity_api_keys
SET scopes = CASE
    WHEN read_only = true THEN ARRAY['read']
    ELSE ARRAY['read', 'write']
END;
ALTER TABLE identity_api_keys
DROP COLUMN read_only;
