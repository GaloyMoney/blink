mod config;
pub mod error;
mod smtp;

use crate::{notification_event::*, primitives::*, user_notification_settings::*};

pub use config::*;
use error::*;
use smtp::SmtpClient;

#[derive(Clone)]
pub struct EmailExecutor {
    pub config: EmailExecutorConfig,
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
            config,
            smtp,
            settings,
        })
    }

    pub async fn notify<T: NotificationEvent>(&self, event: &T) -> Result<(), EmailExecutorError> {
        let settings = self.settings.find_for_user_id(event.user_id()).await?;
        if !settings.should_send_notification(UserNotificationChannel::Email, event.category()) {
            return Ok(());
        }
        let msg = event.to_localized_msg(settings.locale().unwrap_or_default());

        self.smtp.send_email(msg).await?;

        Ok(())
    }
}
