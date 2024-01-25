use thiserror::Error;

use crate::{novu::error::*, user_notification_settings::error::*};

#[derive(Error, Debug)]
pub enum ApplicationError {
    #[error("{0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
    #[error("{0}")]
    Novu(#[from] NovuExecutorError),
}
