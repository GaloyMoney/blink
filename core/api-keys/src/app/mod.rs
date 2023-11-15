mod config;
mod error;

use sqlx::{Pool, Postgres};

use crate::identity::*;

pub use config::*;
pub use error::*;

#[derive(Clone)]
pub struct ApiKeysApp {
    config: AppConfig,
    identities: Identities,
    pool: Pool<Postgres>,
}

impl ApiKeysApp {
    pub fn new(pool: Pool<Postgres>, config: AppConfig) -> Self {
        Self {
            identities: Identities::new(
                pool.clone(),
                std::sync::Arc::new(format!("{}_", config.key_prefix)),
            ),
            config,
            pool,
        }
    }

    #[tracing::instrument(name = "app.lookup_authenticated_subject", skip_all)]
    pub async fn lookup_authenticated_subject(
        &self,
        key: &str,
    ) -> Result<(String, bool), ApplicationError> {
        Ok(self.identities.find_subject_by_key(&key).await?)
    }

    #[tracing::instrument(name = "app.create_api_key_for_subject", skip_all)]
    pub async fn create_api_key_for_subject(
        &self,
        subject_id: &str,
        name: String,
        expire_in_days: Option<u16>,
        read_only: bool,
    ) -> Result<(IdentityApiKey, ApiKeySecret), ApplicationError> {
        let mut tx = self.pool.begin().await?;
        let id = self
            .identities
            .find_or_create_identity_for_subject_in_tx(&mut tx, subject_id)
            .await?;
        let expiry = chrono::Utc::now()
            + expire_in_days
                .map(|days| std::time::Duration::from_secs(days as u64 * 24 * 60 * 60))
                .unwrap_or_else(|| self.config.default_expiry());
        let key = self
            .identities
            .create_key_for_identity_in_tx(&mut tx, id, name, expiry, read_only)
            .await?;
        tx.commit().await?;
        Ok(key)
    }

    #[tracing::instrument(name = "app.list_api_keys_for_subject", skip_all)]
    pub async fn list_api_keys_for_subject(
        &self,
        subject_id: &str,
    ) -> Result<Vec<IdentityApiKey>, ApplicationError> {
        Ok(self.identities.list_keys_for_subject(subject_id).await?)
    }

    #[tracing::instrument(name = "app.revoke_api_key_for_subject", skip_all)]
    pub async fn revoke_api_key_for_subject(
        &self,
        subject: &str,
        key_id: IdentityApiKeyId,
    ) -> Result<IdentityApiKey, ApplicationError> {
        Ok(self.identities.revoke_api_key(subject, key_id).await?)
    }
}
