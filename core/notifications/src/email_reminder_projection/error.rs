use thiserror::Error;

use crate::user_notification_settings::error::*;

#[derive(Debug, Error)]
pub enum EmailReminderProjectionError {
    #[error("EmailReminderProjection - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("EmailReminderProjection - UserNotificationSettings: {0}")]
    UserNotificationSettings(#[from] UserNotificationSettingsError),
}
