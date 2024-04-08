use sqlx::PgPool;

use crate::{messages::LocalizedInAppMessage, notification_event::*, primitives::*};

use super::{entity::*, error::*};

#[derive(Debug, Clone)]
pub struct InAppNotifications {
    pool: PgPool,
}

impl InAppNotifications {
    pub fn new(pool: &PgPool) -> Self {
        InAppNotifications { pool: pool.clone() }
    }

    pub async fn persist(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        user_id: GaloyUserId,
        payload: NotificationEventPayload,
    ) -> Result<(), InAppNotificationError> {
        let notification_id = InAppNotificationId::new();
        let payload_json = serde_json::to_value(payload).expect("Could not serialize payload");
        sqlx::query!(
            r#"
            INSERT INTO in_app_notifications (id, galoy_user_id, payload)
            VALUES ($1, $2, $3)
            "#,
            notification_id as InAppNotificationId,
            user_id.as_ref(),
            payload_json
        )
        .execute(&mut **tx)
        .await?;

        Ok(())
    }

    pub async fn send_msg(
        &self,
        _user_id: &GaloyUserId,
        _msg: LocalizedInAppMessage,
        _deep_link: Option<DeepLink>,
    ) -> Result<(), InAppNotificationError> {
        unimplemented!()
    }

    // can we have 2 separate fn's ?
    // unread_msgs_for_user and all_msgs_for_user
    pub async fn msgs_for_user(
        &self,
        user_id: &GaloyUserId,
        _only_unread: bool,
    ) -> Result<Vec<InAppNotification>, InAppNotificationError> {
        let rows = sqlx::query!(
            r#"
            SELECT *
            FROM in_app_notifications
            WHERE galoy_user_id = $1
            ORDER BY created_at DESC
            "#,
            user_id.as_ref()
        )
        .fetch_all(&self.pool)
        .await?;

        let notifications = rows
            .into_iter()
            .map(|row| InAppNotification {
                id: InAppNotificationId::from(row.id),
                user_id: GaloyUserId::from(row.galoy_user_id),
                payload: serde_json::from_value(row.payload).expect("invalid payload"),
                created_at: row.created_at,
                read_at: row.read_at,
            })
            .collect();

        Ok(notifications)
    }

    pub async fn mark_as_read(
        &self,
        user_id: &GaloyUserId,
        notification_id: InAppNotificationId,
    ) -> Result<(), InAppNotificationError> {
        sqlx::query!(
            r#"
            UPDATE in_app_notifications
            SET read_at = NOW()
            WHERE galoy_user_id = $1 AND id = $2
            "#,
            user_id.as_ref(),
            notification_id as InAppNotificationId,
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(())
    }
}
