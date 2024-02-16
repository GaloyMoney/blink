mod config;
pub mod error;
mod smtp;

use crate::{notification_event::*, user_notification_settings::*};

pub use config::*;
use error::*;
use smtp::SmtpClient;

#[derive(Clone)]
pub struct EmailExecutor {
    _config: EmailExecutorConfig,
    smtp: SmtpClient,
    settings: UserNotificationSettingsRepo,
}

impl EmailExecutor {
    pub fn init(
        config: EmailExecutorConfig,
        settings: UserNotificationSettingsRepo,
    ) -> Result<Self, EmailExecutorError> {
        let smtp = SmtpClient::init(config.smtp.clone())?;
        Ok(EmailExecutor {
            _config: config,
            smtp,
            settings,
        })
    }

    pub async fn notify<T: NotificationEvent>(&self, event: &T) -> Result<(), EmailExecutorError> {
        let settings = self.settings.find_for_user_id(event.user_id()).await?;
        let msg = event.to_localized_msg(settings.locale().unwrap_or_default());
        self.smtp.send_email(msg).await?;
        Ok(())
    }
}
