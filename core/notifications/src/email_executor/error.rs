use thiserror::Error;

use super::smtp::error::SmtpError;
use crate::user_notification_settings::error::*;

#[derive(Error, Debug)]
pub enum EmailExecutorError {
    #[error("EmailExecutorError - SmtpError: {0}")]
    SmtpError(#[from] SmtpError),
    #[error("EmailExecutorError - UserNotificationSettingsError: {0}")]
    UserNotificationSettingsError(#[from] UserNotificationSettingsError),
    #[error("EmailExecutorError - HandlebarsError: {0}")]
    HandlebarsError(#[from] handlebars::TemplateError),
}
