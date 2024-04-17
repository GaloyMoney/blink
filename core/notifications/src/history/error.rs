use thiserror::Error;

use crate::user_notification_settings::error::UserNotificationSettingsError;

#[derive(Error, Debug)]
pub enum NotificationHistoryError {
    #[error("NotificationHistoryError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("NotificationHistoryError - UserNotificationSettings: {0}")]
    UserNotificationSettings(#[from] UserNotificationSettingsError),
}
