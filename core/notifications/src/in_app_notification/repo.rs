use sqlx::PgPool;

use crate::primitives::*;

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
        notification: InAppNotification,
    ) -> Result<(), InAppNotificationError> {
        let deep_link =
            serde_json::to_string(&notification.deep_link).expect("unable to serialize deep_link");
        sqlx::query!(
            r#"
            INSERT INTO in_app_notifications (id, galoy_user_id, title, body, deep_link, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            notification.id as InAppNotificationId,
            notification.user_id.as_ref(),
            notification.title,
            notification.body,
            deep_link,
            notification.created_at,
        )
        .execute(&mut **tx)
        .await?;

        Ok(())
    }

    // can we have 2 separate fn's ?
    // unread_msgs_for_user and all_msgs_for_user
    pub async fn find_for_user(
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

        let notifications =
            rows.into_iter()
                .map(|row| InAppNotification {
                    id: InAppNotificationId::from(row.id),
                    user_id: GaloyUserId::from(row.galoy_user_id),
                    title: row.title,
                    body: row.body,
                    deep_link: row.deep_link.as_ref().map(|dl| {
                        serde_json::from_str(dl).expect("unable to deserialize deep_link")
                    }),
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
    ) -> Result<InAppNotification, InAppNotificationError> {
        let row = sqlx::query!(
            r#"
            UPDATE in_app_notifications
            SET read_at = NOW()
            WHERE galoy_user_id = $1 AND id = $2
            RETURNING *
            "#,
            user_id.as_ref(),
            notification_id as InAppNotificationId,
        )
        .fetch_one(&self.pool)
        .await?;

        let notification = InAppNotification {
            id: InAppNotificationId::from(row.id),
            user_id: GaloyUserId::from(row.galoy_user_id),
            title: row.title,
            body: row.body,
            deep_link: row
                .deep_link
                .as_ref()
                .map(|dl| serde_json::from_str(dl).expect("unable to deserialize deep_link")),
            created_at: row.created_at,
            read_at: row.read_at,
        };

        Ok(notification)
    }
}
