use thiserror::Error;

use super::lettre::error::LettreError;
use crate::user_notification_settings::error::*;

#[derive(Error, Debug)]
pub enum EmailExecutorError {
    #[error("EmailExecutorError - LettreError: {0}")]
    LettreError(#[from] LettreError),
    #[error("EmailExecutorError - UserNotificationSettingsError: {0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
}
