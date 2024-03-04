use sqlx::{Postgres, Transaction};
use thiserror::Error; // Add missing import

#[derive(Debug, Error)]
pub enum NotificationCoolOffTrackerError {
    #[error("NotificationCoolOffTrackerError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
}

pub struct NotificationCoolOffTracker {}

impl NotificationCoolOffTracker {
    pub async fn update_price_changed_trigger(
        tx: &mut Transaction<'_, Postgres>,
    ) -> Result<Option<chrono::DateTime<chrono::Utc>>, NotificationCoolOffTrackerError> {
        let res = sqlx::query!(
            r#"WITH last_trigger AS (
               SELECT last_triggered_at
               FROM notification_cool_off_tracker
               WHERE event_type = 'price_changed'
               FOR UPDATE
               ), updated AS (
               UPDATE notification_cool_off_tracker
               SET last_triggered_at = now()
               WHERE event_type = 'price_changed'
               )
               SELECT last_triggered_at FROM last_trigger"#
        )
        .fetch_one(&mut **tx)
        .await?;
        Ok(res.last_triggered_at)
    }
}
