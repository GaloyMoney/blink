mod entity;
pub mod error;
mod repo;

use sqlx::PgPool;

use crate::{
    notification_event::NotificationEventPayload,
    primitives::{GaloyUserId, InAppNotificationId},
    user_notification_settings::*,
};

pub use entity::*;
use error::InAppNotificationError;
use repo::*;

#[derive(Clone)]
pub struct InAppNotifications {
    in_app_notifications_repo: InAppNotificationsRepo,
    settings: UserNotificationSettingsRepo,
}

impl InAppNotifications {
    pub fn new(pool: &PgPool, settings: UserNotificationSettingsRepo) -> Self {
        let in_app_notifications_repo = InAppNotificationsRepo::new(pool.clone());
        Self {
            in_app_notifications_repo,
            settings,
        }
    }

    pub async fn persist(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        user_id: GaloyUserId,
        payload: NotificationEventPayload,
    ) -> Result<(), InAppNotificationError> {
        let user_settings = self.settings.find_for_user_id(&user_id).await?;
        if let Some(msg) =
            payload.to_localized_in_app_msg(user_settings.locale().unwrap_or_default())
        {
            let notification = InAppNotification::new(user_id, msg, payload.deep_link());
            self.in_app_notifications_repo
                .persist(tx, notification)
                .await?;
        }
        Ok(())
    }

    pub async fn mark_as_read(
        &self,
        user_id: GaloyUserId,
        notification_id: InAppNotificationId,
    ) -> Result<InAppNotification, InAppNotificationError> {
        self.in_app_notifications_repo
            .mark_as_read(user_id, notification_id)
            .await
    }

    pub async fn find_for_user(
        &self,
        user_id: GaloyUserId,
        only_unread: bool,
    ) -> Result<Vec<InAppNotification>, InAppNotificationError> {
        self.in_app_notifications_repo
            .find_for_user(user_id, only_unread)
            .await
    }
}
