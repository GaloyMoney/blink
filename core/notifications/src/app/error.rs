use thiserror::Error;

use crate::account_notification_settings::error::*;

#[derive(Error, Debug)]
pub enum ApplicationError {
    #[error("{0}")]
    AccountNotificationSettingsError(#[from] AccountNotificationSettingsError),
}
