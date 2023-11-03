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

    pub async fn lookup_authenticated_subject(
        &self,
        key: &str,
    ) -> Result<String, ApplicationError> {
        Ok(self.identities.find_subject_by_key(&key).await?)
    }

    pub async fn create_api_key_for_subject(
        &self,
        subject_id: &str,
        name: String,
    ) -> Result<(IdentityApiKey, ApiKeySecret), ApplicationError> {
        let mut tx = self.pool.begin().await?;
        let id = self
            .identities
            .find_or_create_identity_for_subject_in_tx(&mut tx, subject_id)
            .await?;
        let expiry = chrono::Utc::now() + self.config.default_expiry();
        let key = self
            .identities
            .create_key_for_identity_in_tx(&mut tx, id, name, expiry)
            .await?;
        tx.commit().await?;
        Ok(key)
    }
}
