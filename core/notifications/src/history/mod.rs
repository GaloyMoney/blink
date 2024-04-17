mod entity;
pub mod error;
mod repo;

use sqlx::PgPool;

use crate::{
    notification_event::NotificationEventPayload,
    primitives::{GaloyUserId, StatefulNotificationId},
    user_notification_settings::*,
};

pub use entity::*;
use error::NotificationHistoryError;
use repo::*;

#[derive(Clone)]
pub struct NotificationHistory {
    repo: PersistentNotifications,
    settings: UserNotificationSettingsRepo,
}

impl NotificationHistory {
    pub fn new(pool: &PgPool, settings: UserNotificationSettingsRepo) -> Self {
        let repo = PersistentNotifications::new(pool.clone());
        Self { repo, settings }
    }

    pub async fn add_event(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        user_id: GaloyUserId,
        payload: NotificationEventPayload,
    ) -> Result<(), NotificationHistoryError> {
        if !payload.should_be_added_to_history() {
            return Ok(());
        }

        let user_settings = self.settings.find_for_user_id(&user_id).await?;
        let msg =
            payload.to_localized_persistent_message(user_settings.locale().unwrap_or_default());
        let notification = NewStatefulNotification::builder()
            .user_id(user_id)
            .title(msg.title)
            .body(msg.body)
            .deep_link(payload.deep_link())
            .build()
            .expect("Couldn't build new persistent notification");

        self.repo.persist_in_tx(tx, notification).await?;
        Ok(())
    }

    pub async fn add_events(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        user_ids: Vec<GaloyUserId>,
        payload: NotificationEventPayload,
    ) -> Result<(), NotificationHistoryError> {
        if !payload.should_be_added_to_history() {
            return Ok(());
        }

        let user_notification_settings = self.settings.find_for_user_ids(user_ids).await?;

        let mut new_notifications = Vec::new();

        for user_settings in user_notification_settings.iter() {
            let msg =
                payload.to_localized_persistent_message(user_settings.locale().unwrap_or_default());
            let notification = NewStatefulNotification::builder()
                .user_id(user_settings.galoy_user_id.clone())
                .title(msg.title)
                .body(msg.body)
                .deep_link(payload.deep_link())
                .build()
                .expect("Couldn't build new persistent notification");
            new_notifications.push(notification);
        }

        self.repo.persist_new_batch(tx, new_notifications).await?;

        Ok(())
    }

    //     pub async fn notification_read(
    //         &self,
    //         user_id: GaloyUserId,
    //         notification_id: InAppNotificationId,
    //     ) -> Result<InAppNotification, InAppNotificationError> {
    //         self.in_app_notifications_repo
    //             .mark_as_read(user_id, notification_id)
    //             .await
    //     }

    //     pub async fn find_for_user(
    //         &self,
    //         user_id: GaloyUserId,
    //         only_unread: bool,
    //     ) -> Result<Vec<InAppNotification>, InAppNotificationError> {
    //         if only_unread {
    //             self.in_app_notifications_repo
    //                 .find_unread_for_user(user_id)
    //                 .await
    //         } else {
    //             self.in_app_notifications_repo
    //                 .find_all_for_user(user_id)
    //                 .await
    //         }
    //     }
}
