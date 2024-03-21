use sqlx::PgPool;
use thiserror::Error;

use crate::primitives::GaloyUserId; // Add missing import

#[derive(Debug, Error)]
pub enum UserTransactionTrackerError {
    #[error("UserTransactionTracker - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
}

#[derive(Debug, Clone)]
pub struct UserTransactionTrackerRepo {
    pool: PgPool,
}

impl UserTransactionTrackerRepo {
    pub fn new(pool: &PgPool) -> Self {
        Self { pool: pool.clone() }
    }

    pub async fn persist(
        &self,
        galoy_user_id: GaloyUserId,
    ) -> Result<(), UserTransactionTrackerError> {
        let mut tx = self.pool.begin().await?;
        sqlx::query!(
            r#"INSERT INTO user_transaction_tracker
               (galoy_user_id) VALUES ($1)"#,
            galoy_user_id.as_ref()
        )
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        Ok(())
    }

    pub async fn update(
        &self,
        galoy_user_id: GaloyUserId,
    ) -> Result<(), UserTransactionTrackerError> {
        let mut tx = self.pool.begin().await?;
        sqlx::query!(
            r#"UPDATE user_transaction_tracker SET updated_at = NOW()
               where galoy_user_id = $1"#,
            galoy_user_id.as_ref()
        )
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        Ok(())
    }

    pub async fn list_ids_after(
        &self,
        id: &GaloyUserId,
    ) -> Result<(Vec<GaloyUserId>, bool), UserTransactionTrackerError> {
        let batch_limit = 1000;
        let rows = sqlx::query!(
            r#"SELECT galoy_user_id
               FROM user_transaction_tracker 
               WHERE galoy_user_id > $1 AND updated_at < NOW() - INTERVAL '21 day'
               ORDER BY galoy_user_id
               LIMIT $2"#,
            id.as_ref(),
            batch_limit as i64 + 1,
        )
        .fetch_all(&self.pool)
        .await?;
        let more = rows.len() > batch_limit;
        Ok((
            rows.into_iter()
                .take(batch_limit)
                .map(|r| GaloyUserId::from(r.galoy_user_id))
                .collect(),
            more,
        ))
    }
}
