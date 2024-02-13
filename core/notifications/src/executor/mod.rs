mod config;
pub mod error;
mod fcm;

use fcm::{error::FcmError, FcmClient};
use tracing::{error, instrument};

use crate::{notification_event::*, primitives::*, user_notification_settings::*};

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct Executor {
    _config: ExecutorConfig,
    fcm: FcmClient,
    settings: UserNotificationSettingsRepo,
}

impl Executor {
    pub async fn init(
        mut config: ExecutorConfig,
        settings: UserNotificationSettingsRepo,
    ) -> Result<Self, ExecutorError> {
        Ok(Self {
            fcm: FcmClient::init(config.fcm.service_account_key()).await?,
            _config: config,
            settings,
        })
    }

    #[instrument(
        name = "executor.notify",
        skip(self),
        fields(n_errors, n_removed_tokens),
        err
    )]
    pub async fn notify<T: NotificationEvent>(&self, event: &T) -> Result<(), ExecutorError> {
        let mut settings = self.settings.find_for_user_id(event.user_id()).await?;
        if !settings.should_send_notification(UserNotificationChannel::Push, event.category()) {
            return Ok(());
        }

        let msg = event.to_localized_msg(settings.locale().unwrap_or_default());

        let mut should_persist = false;
        let mut last_err = None;
        let mut n_errs = 0;
        let mut n_removed_tokens = 0;
        for device_token in settings.push_device_tokens() {
            match self.fcm.send(&device_token, &msg, event.deep_link()).await {
                Err(FcmError::GoogleFcm1Error(google_fcm1::Error::BadRequest(e))) => {
                    n_errs += 1;
                    n_removed_tokens += 1;
                    error!("BadRequest sending to device: {}", e);
                    should_persist = true;
                    settings.remove_push_device_token(device_token)
                }
                Err(e) => {
                    n_errs += 1;
                    error!("Unexpected error sending to device: {}", e);
                    last_err = Some(e.into())
                }
                _ => continue,
            }
        }

        if should_persist {
            let _ = self.settings.persist(&mut settings).await;
        }

        tracing::Span::current().record("n_errors", n_errs);
        tracing::Span::current().record("n_removed_tokens", n_removed_tokens);

        if let Some(e) = last_err {
            Err(e)
        } else {
            Ok(())
        }
    }
}
