mod error;

use rand::distributions::{Alphanumeric, DistString};
use sqlx::{Pool, Postgres};

use std::sync::Arc;

use crate::scope::*;

pub use error::*;

crate::entity_id! { IdentityApiKeyId }
crate::entity_id! { IdentityId }

#[derive(Debug)]
pub struct IdentityApiKey {
    pub name: String,
    pub id: IdentityApiKeyId,
    pub identity_id: IdentityId,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
    pub last_used_at: Option<chrono::DateTime<chrono::Utc>>,
    pub revoked: bool,
    pub expired: bool,
    pub scopes: Vec<Scope>,
}

pub struct ApiKeySecret(String);
impl ApiKeySecret {
    pub fn into_inner(self) -> String {
        self.0
    }
}

#[derive(Clone)]
pub struct Identities {
    pool: Pool<Postgres>,
    key_prefix: Arc<String>,
}
impl Identities {
    pub fn new(pool: Pool<Postgres>, key_prefix: Arc<String>) -> Self {
        Self { pool, key_prefix }
    }

    pub async fn find_or_create_identity_for_subject_in_tx(
        &self,
        tx: &mut sqlx::Transaction<'_, Postgres>,
        subject_id: &str,
    ) -> Result<IdentityId, IdentityError> {
        let identity = sqlx::query!(
            r#"INSERT INTO identities (subject_id) VALUES ($1)
               ON CONFLICT (subject_id) DO UPDATE SET subject_id = $1
               RETURNING id"#,
            subject_id,
        )
        .fetch_one(&mut **tx)
        .await?;

        Ok(IdentityId::from(identity.id))
    }

    pub async fn create_key_for_identity_in_tx(
        &self,
        tx: &mut sqlx::Transaction<'_, Postgres>,
        identity_id: IdentityId,
        name: String,
        expires_at: Option<chrono::DateTime<chrono::Utc>>,
        scopes: Vec<Scope>,
    ) -> Result<(IdentityApiKey, ApiKeySecret), IdentityError> {
        let code = Alphanumeric.sample_string(&mut rand::thread_rng(), 64);
        let scopes_str = scopes.iter().map(|s| s.to_string()).collect::<Vec<_>>();
        let record = sqlx::query!(
            r#"INSERT INTO identity_api_keys (encrypted_key, identity_id, name, expires_at, scopes)
            VALUES (crypt($1, gen_salt('bf')), $2, $3, $4, $5) RETURNING id, created_at"#,
            code,
            identity_id as IdentityId,
            name,
            expires_at,
            &scopes_str,
        )
        .fetch_one(&mut **tx)
        .await?;

        let key = format!("{}{code}", self.key_prefix);
        Ok((
            IdentityApiKey {
                name,
                id: IdentityApiKeyId::from(record.id),
                identity_id,
                created_at: record.created_at,
                expires_at,
                revoked: false,
                expired: false,
                last_used_at: None,
                scopes,
            },
            ApiKeySecret(key),
        ))
    }

    pub async fn find_subject_by_key(
        &self,
        key: &str,
    ) -> Result<(IdentityApiKeyId, String, Vec<Scope>), IdentityError> {
        let code = match key.strip_prefix(&*self.key_prefix) {
            None => return Err(IdentityError::MismatchedPrefix),
            Some(code) => code,
        };

        let record = sqlx::query!(
            r#"WITH updated_key AS (
                 UPDATE identity_api_keys k
                 SET last_used_at = NOW()
                 FROM identities i
                 WHERE k.identity_id = i.id
                 AND k.revoked = false
                 AND k.encrypted_key = crypt($1, k.encrypted_key)
                 AND (k.expires_at > NOW() OR k.expires_at IS NULL)
                 RETURNING k.id, i.subject_id, k.scopes
               )
               SELECT id, subject_id, scopes FROM updated_key"#,
            code
        )
        .fetch_optional(&self.pool)
        .await?;

        if let Some(record) = record {
            let scopes = record
                .scopes
                .into_iter()
                .map(|s| s.parse::<Scope>().expect("Invalid scope"))
                .collect::<Vec<_>>();
            Ok((IdentityApiKeyId::from(record.id), record.subject_id, scopes))
        } else {
            Err(IdentityError::NoActiveKeyFound)
        }
    }

    pub async fn list_keys_for_subject(
        &self,
        subject_id: &str,
    ) -> Result<Vec<IdentityApiKey>, IdentityError> {
        let api_keys_records = sqlx::query!(
            r#"
            SELECT
                i.id AS identity_id,
                a.id AS api_key_id,
                    a.name,
                    a.created_at,
                    a.expires_at,
                    revoked,
                    (expires_at IS NOT NULL AND expires_at < NOW()) AS "expired!",
                    scopes,
                    last_used_at
            FROM
                identities i
            JOIN
                identity_api_keys a
                ON i.id = a.identity_id
            WHERE
                i.subject_id = $1
            "#,
            subject_id,
        )
        .fetch_all(&self.pool)
        .await?;

        let api_keys = api_keys_records
            .into_iter()
            .map(|record| {
                let scopes = record
                    .scopes
                    .into_iter()
                    .map(|s| s.parse::<Scope>().expect("Invalid scope"))
                    .collect();
                IdentityApiKey {
                    id: IdentityApiKeyId::from(record.api_key_id),
                    name: record.name,
                    identity_id: IdentityId::from(record.identity_id),
                    created_at: record.created_at,
                    expires_at: record.expires_at,
                    revoked: record.revoked,
                    expired: record.expired,
                    last_used_at: record.last_used_at,
                    scopes,
                }
            })
            .collect();

        Ok(api_keys)
    }

    pub async fn revoke_api_key(
        &self,
        subject_id: &str,
        key_id: IdentityApiKeyId,
    ) -> Result<IdentityApiKey, IdentityError> {
        let record = sqlx::query!(
            r#"UPDATE identity_api_keys k
               SET revoked = true,
                   revoked_at = NOW()
               FROM identities i
               WHERE k.identity_id = i.id
               AND i.subject_id = $1
               AND k.id = $2
               RETURNING
               k.name,
               k.identity_id,
               k.created_at,
               k.expires_at,
               k.revoked,
               (expires_at IS NOT NULL AND expires_at < NOW()) AS "expired!",
               k.scopes,
               k.last_used_at
            "#,
            subject_id,
            key_id as IdentityApiKeyId
        )
        .fetch_optional(&self.pool)
        .await?;

        match record {
            Some(record) => {
                let scopes = record
                    .scopes
                    .into_iter()
                    .map(|s| s.parse::<Scope>().expect("Invalid scope"))
                    .collect::<Vec<_>>();
                Ok(IdentityApiKey {
                    id: IdentityApiKeyId::from(key_id),
                    name: record.name,
                    identity_id: IdentityId::from(record.identity_id),
                    created_at: record.created_at,
                    expires_at: record.expires_at,
                    revoked: record.revoked,
                    expired: record.expired,
                    last_used_at: record.last_used_at,
                    scopes,
                })
            }
            None => Err(IdentityError::KeyNotFoundForRevoke),
        }
    }
}
