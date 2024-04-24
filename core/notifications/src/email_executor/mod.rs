mod config;
pub mod error;
mod smtp;

use tracing::instrument;

use crate::{notification_event::*, primitives::GaloyUserId, user_notification_settings::*};

pub use config::*;
use error::*;
use smtp::SmtpClient;

#[derive(Clone)]
pub struct EmailExecutor {
    config: EmailExecutorConfig,
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

    #[instrument(name = "email_executor.notify", skip(self))]
    pub async fn notify<T: NotificationEvent + ?Sized>(
        &self,
        user_id: &GaloyUserId,
        event: &T,
    ) -> Result<(), EmailExecutorError> {
        if !self.config.enabled {
            return Ok(());
        }

        if let Some((settings, addr)) = self
            .settings
            .find_for_user_id(user_id)
            .await
            .ok()
            .and_then(|s| s.email_address().map(|addr| (s, addr)))
        {
            let msg = event.to_localized_email(&settings.locale().unwrap_or_default());
            self.smtp.send_email(msg, addr).await?;
        }
        Ok(())
    }
}
