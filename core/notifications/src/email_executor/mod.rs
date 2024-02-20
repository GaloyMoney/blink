mod config;
pub mod error;
mod smtp;

use handlebars::Handlebars;
use tracing::instrument;

use crate::{notification_event::*, user_notification_settings::*};

pub use config::*;
use error::*;
use smtp::SmtpClient;

#[derive(Clone)]
pub struct EmailExecutor {
    _config: EmailExecutorConfig,
    smtp: SmtpClient,
    settings: UserNotificationSettingsRepo,
    handlebars: Handlebars<'static>,
}

impl EmailExecutor {
    pub fn init(
        config: EmailExecutorConfig,
        settings: UserNotificationSettingsRepo,
    ) -> Result<Self, EmailExecutorError> {
        let smtp = SmtpClient::init(config.smtp.clone())?;
        let mut handlebars = Handlebars::new();
        handlebars.register_template_file("identification", "./templates/identification.hbs")?;
        handlebars.register_template_file("base", "./templates/layouts/base.hbs")?;
        handlebars.register_template_file("styles", "./templates/partials/styles.hbs")?;

        Ok(EmailExecutor {
            _config: config,
            smtp,
            settings,
            handlebars,
        })
    }

    #[instrument(name = "email_executor.notify", skip(self))]
    pub async fn notify<T: NotificationEvent>(&self, event: &T) -> Result<(), EmailExecutorError> {
        if let Some((settings, addr)) = self
            .settings
            .find_for_user_id(event.user_id())
            .await
            .ok()
            .and_then(|s| s.email_address().map(|addr| (s, addr)))
        {
            let msg =
                event.to_localized_email(settings.locale().unwrap_or_default(), &self.handlebars);
            if let Some(msg) = msg {
                self.smtp.send_email(msg, addr).await?;
            }
        }
        Ok(())
    }
}
