mod config;
pub mod error;

use tracing::instrument;

use crate::{
    in_app_notification::*, notification_event::*, primitives::GaloyUserId,
    user_notification_settings::*,
};

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct InAppExecutor {
    settings: UserNotificationSettingsRepo,
    in_app_channel: InAppNotificationsRepo,
}

impl InAppExecutor {
    pub fn new(
        settings: UserNotificationSettingsRepo,
        in_app_channel: InAppNotificationsRepo,
    ) -> Self {
        Self {
            settings,
            in_app_channel,
        }
    }

    #[instrument(name = "in_app_executor.notify", skip(self))]
    pub async fn notify<T: NotificationEvent + ?Sized>(
        &self,
        user_id: &GaloyUserId,
        event: &T,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    ) -> Result<(), InAppExecutorError> {
        if let Ok(settings) = self.settings.find_for_user_id(user_id).await {
            let msg = event.to_localized_in_app_msg(settings.locale().unwrap_or_default());
            if let Some(msg) = msg {
                let notification = InAppNotification::new(*user_id, msg, event.deep_link());
                self.in_app_channel.persist(tx, notification).await?;
            }
        }
        Ok(())
    }
}
