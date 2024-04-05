mod config;
pub mod error;

use tracing::instrument;

use crate::{
    in_app_channel::*, notification_event::*, primitives::GaloyUserId,
    user_notification_settings::*,
};

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct InAppExecutor {
    settings: UserNotificationSettingsRepo,
    in_app_channel: InAppChannel,
}

impl InAppExecutor {
    pub fn init(
        settings: UserNotificationSettingsRepo,
        in_app_channel: InAppChannel,
    ) -> Result<Self, InAppExecutorError> {
        Ok(InAppExecutor {
            settings,
            in_app_channel,
        })
    }

    #[instrument(name = "in_app_executor.notify", skip(self))]
    pub async fn notify<T: NotificationEvent + ?Sized>(
        &self,
        user_id: &GaloyUserId,
        event: &T,
    ) -> Result<(), InAppExecutorError> {
        if let Some(settings) = self.settings.find_for_user_id(user_id).await.ok() {
            let msg = event.to_localized_in_app_msg(settings.locale().unwrap_or_default());
            if let Some(msg) = msg {
                self.in_app_channel
                    .send_msg(user_id, msg, event.deep_link())
                    .await?;
            }
        }
        Ok(())
    }
}
