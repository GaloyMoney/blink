pub mod error;
pub mod seed;

use chrono::*;
use sqlx::PgPool;

use crate::primitives::*;

use error::*;

#[derive(Debug, Clone)]
pub struct EmailReminderProjection {
    _pool: PgPool,
}

impl EmailReminderProjection {
    pub fn new(pool: &PgPool) -> Self {
        Self {
            _pool: pool.clone(),
        }
    }

    pub async fn new_user_without_email(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        galoy_user_id: GaloyUserId,
        created_at: DateTime<Utc>,
    ) -> Result<(), EmailReminderProjectionError> {
        sqlx::query!(
            r#"INSERT INTO email_reminder_projection
               (galoy_user_id, user_created_at) VALUES ($1, $2)"#,
            galoy_user_id.as_ref(),
            created_at
        )
        .execute(&mut **tx)
        .await?;
        Ok(())
    }
}
