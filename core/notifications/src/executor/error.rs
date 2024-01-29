use thiserror::Error;

use super::novu::error::NovuError;
use crate::user_notification_settings::error::*;

#[derive(Error, Debug)]
pub enum ExecutorError {
    #[error("ExecutorError - Novu: {0}")]
    Novu(#[from] NovuError),
    #[error("ExecutorError - UserNotificationSettingsError: {0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
}
