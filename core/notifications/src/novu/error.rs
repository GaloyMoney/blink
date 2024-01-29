use thiserror::Error;

use super::client::error::NovuError;
use crate::user_notification_settings::error::*;

#[derive(Error, Debug)]
pub enum NovuExecutorError {
    #[error("NovuExecutorError - Novu: {0}")]
    Novu(#[from] NovuError),
    #[error("NovuExecutorError - UserNotificationSettingsError: {0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
}
