mod config;
pub mod error;
mod fcm;

use fcm::{error::FcmError, FcmClient};

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

    pub async fn notify<T: NotificationEvent>(&self, event: &T) -> Result<(), ExecutorError> {
        let mut settings = self.settings.find_for_user_id(event.user_id()).await?;
        if !settings.should_send_notification(
            UserNotificationChannel::Push,
            UserNotificationCategory::Circles,
        ) {
            return Ok(());
        }

        let msg = event.to_localized_msg(settings.locale().unwrap_or_default());

        let mut should_persist = false;
        for device_token in settings.push_device_tokens() {
            let res = self.fcm.send(&device_token, &msg, event.deep_link()).await;
            if let Err(e) = res {
                match e {
                    FcmError::GoogleFcm1Error(google_fcm1::Error::BadRequest(_)) => {
                        should_persist = true;
                        settings.remove_push_device_token(device_token)
                    }
                    _ => return Err(ExecutorError::Fcm(e)),
                }
            }
        }

        if should_persist {
            self.settings.persist(&mut settings).await?;
        }

        Ok(())
    }
}
