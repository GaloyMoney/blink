use sqlx::{Postgres, Transaction};
use thiserror::Error; // Add missing import

#[derive(Debug, Error)]
pub enum NotificationCoolOffTrackerError {
    #[error("NotificationCoolOffTrackerError - Sqlx: {0}")]
    Sqlx(sqlx::Error),
}

impl From<sqlx::Error> for NotificationCoolOffTrackerError {
    fn from(error: sqlx::Error) -> Self {
        Self::Sqlx(error)
    }
}

pub struct NotificationCoolOffTracker {}

impl NotificationCoolOffTracker {
    const COOL_OFF_PERIOD: std::time::Duration = std::time::Duration::from_secs(60 * 60 * 24 * 3);

    pub async fn can_trigger_price_changed(
        tx: &mut Transaction<'_, Postgres>,
    ) -> Result<bool, NotificationCoolOffTrackerError> {
        let cool_off_threshold = chrono::Utc::now() - Self::COOL_OFF_PERIOD;

        let row = sqlx::query!(
            r#"
                UPDATE notification_cool_off_tracker
                SET last_triggered_at = now()
                WHERE event_type = 'price_changed'
                AND (last_triggered_at < $1 OR last_triggered_at IS NULL)
                RETURNING event_type, last_triggered_at
            "#,
            cool_off_threshold
        )
        .fetch_optional(&mut **tx)
        .await?;

        match row {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }
}
