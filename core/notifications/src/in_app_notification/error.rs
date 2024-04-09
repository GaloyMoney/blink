use thiserror::Error;

use crate::user_notification_settings::error::UserNotificationSettingsError;

#[derive(Error, Debug)]
pub enum InAppNotificationError {
    #[error("InAppNotificationError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("InAppNotificationError - UserNotificationSettings: {0}")]
    UserNotificationSettings(#[from] UserNotificationSettingsError),
}
