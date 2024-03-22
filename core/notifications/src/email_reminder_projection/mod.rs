pub mod error;

use chrono::*;
use sqlx::PgPool;

use crate::primitives::*;

use error::*;

#[derive(Debug, Clone)]
pub struct EmailReminderProjection {
    pool: PgPool,
}

const PAGINATION_BATCH_SIZE: i64 = 1000;

impl EmailReminderProjection {
    const ACCOUNT_LIVENESS_THRESHOLD_DAYS: i64 = 21;
    const ACCOUNT_AGED_THRESHOLD_DAYS: i64 = 21;
    const NOTIFICATION_COOL_OFF_THRESHOLD_DAYS: i64 = 90;

    pub fn new(pool: &PgPool) -> Self {
        Self { pool: pool.clone() }
    }

    pub async fn transaction_occurred_for_user_without_email(
        &self,
        galoy_user_id: &GaloyUserId,
    ) -> Result<(), EmailReminderProjectionError> {
        sqlx::query!(
            r#"INSERT INTO email_reminder_projection
               (galoy_user_id, last_transaction_at) VALUES ($1, now())
               ON CONFLICT (galoy_user_id) DO UPDATE
               SET last_transaction_at = now()"#,
            galoy_user_id.as_ref(),
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn user_added_email(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        galoy_user_id: GaloyUserId,
    ) -> Result<(), EmailReminderProjectionError> {
        sqlx::query!(
            r#"DELETE FROM email_reminder_projection
               WHERE galoy_user_id = $1"#,
            galoy_user_id.as_ref()
        )
        .execute(&mut **tx)
        .await?;
        Ok(())
    }

    pub async fn list_ids_to_notify_after(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        search_id: GaloyUserId,
    ) -> Result<(Vec<GaloyUserId>, bool), EmailReminderProjectionError> {
        let last_transaction_at_threshold = Utc::now()
            - Duration::try_days(Self::ACCOUNT_LIVENESS_THRESHOLD_DAYS)
                .expect("Should be valid duration");
        let user_first_seen_at_threshold = Utc::now()
            - Duration::try_days(Self::ACCOUNT_AGED_THRESHOLD_DAYS)
                .expect("Should be valid duration");
        let last_notified_at_threshold = Utc::now()
            - Duration::try_days(Self::NOTIFICATION_COOL_OFF_THRESHOLD_DAYS)
                .expect("Should be valid duration");

        let rows = sqlx::query!(
            r#"WITH selected_rows AS (
                 SELECT galoy_user_id
                 FROM email_reminder_projection
                 WHERE galoy_user_id > $1
                   AND last_transaction_at IS NOT NULL
                   AND last_transaction_at > $2
                   AND user_first_seen_at < $3
                   AND (last_notified_at IS NULL OR last_notified_at < $4)
                 ORDER BY galoy_user_id
                 LIMIT $5
             ),
             updated AS (
                 UPDATE email_reminder_projection
                 SET last_notified_at = NOW()
                 FROM selected_rows
                 WHERE email_reminder_projection.galoy_user_id = selected_rows.galoy_user_id
                 RETURNING email_reminder_projection.galoy_user_id
             )
             SELECT galoy_user_id
             FROM updated
             "#,
            search_id.as_ref(),
            last_transaction_at_threshold,
            user_first_seen_at_threshold,
            last_notified_at_threshold,
            PAGINATION_BATCH_SIZE + 1,
        )
        .fetch_all(&mut **tx)
        .await?;

        let more = rows.len() > PAGINATION_BATCH_SIZE as usize;

        Ok((
            rows.into_iter()
                .take(PAGINATION_BATCH_SIZE as usize)
                .map(|r| GaloyUserId::from(r.galoy_user_id))
                .collect(),
            more,
        ))
    }
}
