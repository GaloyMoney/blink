use es_entity::*;
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

    pub async fn create_in_tx(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        notification: NewStatefulNotification,
    ) -> Result<(), NotificationHistoryError> {
        sqlx::query!(
            r#"INSERT INTO stateful_notifications (id, galoy_user_id)
            VALUES ($1, $2) ON CONFLICT DO NOTHING"#,
            notification.id as StatefulNotificationId,
            notification.user_id.as_ref(),
        )
        .execute(&mut **tx)
        .await?;
        notification.initial_events().persist(tx).await?;
        Ok(())
    }

    pub async fn create_new_batch(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        new_notifications: Vec<NewStatefulNotification>,
    ) -> Result<(), NotificationHistoryError> {
        let mut query_builder =
            sqlx::QueryBuilder::new("INSERT INTO stateful_notifications (id, galoy_user_id)");
        query_builder.push_values(new_notifications.iter(), |mut builder, notification| {
            builder.push_bind(notification.id as StatefulNotificationId);
            builder.push_bind(notification.user_id.as_ref());
            builder.push_bind(notification.title.clone());
            builder.push_bind(notification.body.clone());
            builder.push_bind(
                serde_json::to_string(&notification.deep_link)
                    .expect("unable to serialize deep_link"),
            );
        });
        let query = query_builder.build();
        query.execute(&mut **tx).await?;
        es_entity::EntityEvents::batch_persist(
            tx,
            new_notifications.into_iter().map(|n| n.initial_events()),
        )
        .await?;
        Ok(())
    }

    pub async fn update(
        &self,
        notification: &mut StatefulNotification,
    ) -> Result<(), NotificationHistoryError> {
        let mut tx = self.pool.begin().await?;
        notification.events.persist(&mut tx).await?;
        tx.commit().await?;
        Ok(())
    }

    pub async fn find_by_id(
        &self,
        user_id: GaloyUserId,
        id: StatefulNotificationId,
    ) -> Result<StatefulNotification, NotificationHistoryError> {
        let rows = sqlx::query_as!(
            GenericEvent,
            r#"SELECT a.id, e.sequence, e.event,
                      a.created_at AS entity_created_at, e.recorded_at AS event_recorded_at
            FROM stateful_notifications a
            JOIN stateful_notification_events e ON a.id = e.id
            WHERE a.galoy_user_id = $1 AND a.id = $2
            ORDER BY e.sequence"#,
            user_id.as_ref(),
            id as StatefulNotificationId,
        )
        .fetch_all(&self.pool)
        .await?;

        let res = EntityEvents::load_first::<StatefulNotification>(rows)?;
        Ok(res)
    }

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
