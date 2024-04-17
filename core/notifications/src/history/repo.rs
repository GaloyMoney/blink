use sqlx::PgPool;

use crate::primitives::*;

use super::{entity::*, error::*};

#[derive(Debug, Clone)]
pub(super) struct PersistentNotifications {
    pool: PgPool,
}

impl PersistentNotifications {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn persist_new(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        notification: NewPersistentNotification,
    ) -> Result<(), NotificationHistoryError> {
        // let deep_link = serde_json::to_string(&new_in_app_notification.deep_link)
        //     .expect("unable to serialize deep_link");
        // sqlx::query!(
        //     r#"
        //     INSERT INTO in_app_notifications (id, galoy_user_id, title, body, deep_link)
        //     VALUES ($1, $2, $3, $4, $5)
        //     "#,
        //     notification.id as InAppNotificationId,
        //     notification.user_id.into_inner(),
        //     notification.title,
        //     notification.body,
        //     deep_link,
        // )
        // .execute(&mut **tx)
        // .await?;

        Ok(())
    }

    //     pub async fn persist_new_batch(
    //         &self,
    //         tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    //         new_in_app_notifications: Vec<NewInAppNotification>,
    //     ) -> Result<(), InAppNotificationError> {
    //         let mut query_builder = sqlx::QueryBuilder::new(
    //             "INSERT INTO in_app_notifications (id, galoy_user_id, title, body, deep_link)",
    //         );
    //         query_builder.push_values(new_in_app_notifications, |mut builder, notification| {
    //             builder.push_bind(notification.id as InAppNotificationId);
    //             builder.push_bind(notification.user_id.into_inner());
    //             builder.push_bind(notification.title);
    //             builder.push_bind(notification.body);
    //             builder.push_bind(
    //                 serde_json::to_string(&notification.deep_link)
    //                     .expect("unable to serialize deep_link"),
    //             );
    //         });
    //         let query = query_builder.build();
    //         query.execute(&mut **tx).await?;
    //         Ok(())
    //     }

    //     pub async fn find_all_for_user(
    //         &self,
    //         user_id: GaloyUserId,
    //     ) -> Result<Vec<InAppNotification>, InAppNotificationError> {
    //         let rows = sqlx::query!(
    //             r#"
    //                 SELECT *
    //                 FROM in_app_notifications
    //                 WHERE galoy_user_id = $1
    //                 ORDER BY created_at DESC
    //                 "#,
    //             user_id.as_ref()
    //         )
    //         .fetch_all(&self.pool)
    //         .await?;

    //         let notifications = rows
    //             .into_iter()
    //             .map(|row| InAppNotification {
    //                 id: InAppNotificationId::from(row.id),
    //                 user_id: GaloyUserId::from(row.galoy_user_id),
    //                 title: row.title,
    //                 body: row.body,
    //                 deep_link: match row.deep_link {
    //                     Some(ref dl) => serde_json::from_str(dl).ok(),
    //                     None => None,
    //                 },
    //                 created_at: row.created_at,
    //                 read_at: row.read_at,
    //             })
    //             .collect();

    //         Ok(notifications)
    //     }

    //     pub async fn find_unread_for_user(
    //         &self,
    //         user_id: GaloyUserId,
    //     ) -> Result<Vec<InAppNotification>, InAppNotificationError> {
    //         let rows = sqlx::query!(
    //             r#"
    //                 SELECT *
    //                 FROM in_app_notifications
    //                 WHERE galoy_user_id = $1 AND read_at IS NULL
    //                 ORDER BY created_at DESC
    //                 "#,
    //             user_id.as_ref()
    //         )
    //         .fetch_all(&self.pool)
    //         .await?;

    //         let notifications = rows
    //             .into_iter()
    //             .map(|row| InAppNotification {
    //                 id: InAppNotificationId::from(row.id),
    //                 user_id: GaloyUserId::from(row.galoy_user_id),
    //                 title: row.title,
    //                 body: row.body,
    //                 deep_link: match row.deep_link {
    //                     Some(ref dl) => serde_json::from_str(dl).ok(),
    //                     None => None,
    //                 },
    //                 created_at: row.created_at,
    //                 read_at: row.read_at,
    //             })
    //             .collect();

    //         Ok(notifications)
    //     }

    //     pub async fn mark_as_read(
    //         &self,
    //         user_id: GaloyUserId,
    //         notification_id: InAppNotificationId,
    //     ) -> Result<InAppNotification, InAppNotificationError> {
    //         let row = sqlx::query!(
    //             r#"
    //             UPDATE in_app_notifications
    //             SET read_at = NOW()
    //             WHERE galoy_user_id = $1 AND id = $2
    //             RETURNING *
    //             "#,
    //             user_id.as_ref(),
    //             notification_id as InAppNotificationId,
    //         )
    //         .fetch_one(&self.pool)
    //         .await?;

    //         let notification = InAppNotification {
    //             id: InAppNotificationId::from(row.id),
    //             user_id: GaloyUserId::from(row.galoy_user_id),
    //             title: row.title,
    //             body: row.body,
    //             deep_link: match row.deep_link {
    //                 Some(ref dl) => serde_json::from_str(dl).ok(),
    //                 None => None,
    //             },
    //             created_at: row.created_at,
    //             read_at: row.read_at,
    //         };

    //         Ok(notification)
    //     }
}
