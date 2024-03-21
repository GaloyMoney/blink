use sqlx::PgPool;

use es_entity::*;

use super::{entity::*, error::*};
use crate::primitives::*;

const PAGINATION_BATCH_SIZE: i64 = 1000;

#[derive(Debug, Clone)]
pub struct UserNotificationSettingsRepo {
    pool: PgPool,
}

impl UserNotificationSettingsRepo {
    pub fn new(pool: &PgPool) -> Self {
        Self { pool: pool.clone() }
    }

    pub async fn find_for_user_id(
        &self,
        user_id: &GaloyUserId,
    ) -> Result<UserNotificationSettings, UserNotificationSettingsError> {
        let rows = sqlx::query_as!(
            GenericEvent,
            r#"SELECT a.id, e.sequence, e.event,
                      a.created_at AS entity_created_at, e.recorded_at AS event_recorded_at
            FROM user_notification_settings a
            JOIN user_notification_settings_events e ON a.id = e.id
            WHERE a.galoy_user_id = $1
            ORDER BY e.sequence"#,
            user_id.as_ref(),
        )
        .fetch_all(&self.pool)
        .await?;

        let res = EntityEvents::load_first::<UserNotificationSettings>(rows);
        if matches!(res, Err(EntityError::NoEntityEventsPresent)) {
            return Ok(UserNotificationSettings::new(user_id.clone()));
        }
        Ok(res?)
    }

    pub async fn list_after_id(
        &self,
        id: &GaloyUserId,
    ) -> Result<(Vec<UserNotificationSettings>, bool), UserNotificationSettingsError> {
        let rows = sqlx::query_as!(
            GenericEvent,
            r#"SELECT a.id, e.sequence, e.event,
                      a.created_at AS entity_created_at, e.recorded_at AS event_recorded_at
            FROM user_notification_settings a
            JOIN user_notification_settings_events e ON a.id = e.id
            WHERE galoy_user_id > $1
            ORDER BY galoy_user_id, e.sequence
            LIMIT $2"#,
            id.as_ref(),
            PAGINATION_BATCH_SIZE + 1,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(EntityEvents::load_n::<UserNotificationSettings>(
            rows,
            PAGINATION_BATCH_SIZE as usize,
        )?)
    }

    pub async fn persist(
        &self,
        settings: &mut UserNotificationSettings,
    ) -> Result<(), UserNotificationSettingsError> {
        let mut tx = self.pool.begin().await?;
        sqlx::query!(
            r#"INSERT INTO user_notification_settings (id, galoy_user_id)
            VALUES ($1, $2) ON CONFLICT DO NOTHING"#,
            settings.id as UserNotificationSettingsId,
            settings.galoy_user_id.as_ref(),
        )
        .execute(&mut *tx)
        .await?;
        settings.events.persist(&mut tx).await?;
        tx.commit().await?;
        Ok(())
    }

    pub async fn list_ids_after(
        &self,
        id: &GaloyUserId,
    ) -> Result<(Vec<GaloyUserId>, bool), UserNotificationSettingsError> {
        let rows = sqlx::query!(
            r#"SELECT galoy_user_id
               FROM user_notification_settings
               WHERE galoy_user_id > $1
               ORDER BY galoy_user_id
               LIMIT $2"#,
            id.as_ref(),
            PAGINATION_BATCH_SIZE + 1,
        )
        .fetch_all(&self.pool)
        .await?;
        let more = rows.len() > PAGINATION_BATCH_SIZE as usize;
        Ok((
            rows.into_iter()
                .take(PAGINATION_BATCH_SIZE as usize)
                .map(|r| GaloyUserId::from(r.galoy_user_id))
                .collect(),
            more,
        ))
    }
}
