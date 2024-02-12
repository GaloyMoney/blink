mod config;
pub mod error;
mod fcm;

use fcm::FcmClient;

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
        let settings = self.settings.find_for_user_id(event.user_id()).await?;
        if !settings.should_send_notification(
            UserNotificationChannel::Push,
            UserNotificationCategory::Circles,
        ) {
            return Ok(());
        }

        let msg = event.to_localized_msg(settings.locale().unwrap_or_default());

        self.fcm
            .send(settings.push_device_tokens(), msg, event.deep_link())
            .await?;

        Ok(())
    }
}
