use thiserror::Error;

use crate::user_notification_settings::error::*;

#[derive(Error, Debug)]
pub enum NovuExecutorError {
    #[error("NovuExecutorError - Novu: {0}")]
    Novu(#[from] novu::error::NovuError),
    #[error("NovuExecutorError - UserNotificationSettingsError: {0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
}
