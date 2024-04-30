use sqlx::PgPool;

use es_entity::*;

use super::{entity::*, error::*};
use crate::primitives::*;

const PAGINATION_BATCH_SIZE: i64 = 1000;

#[derive(Debug, Clone)]
pub struct UserNotificationSettingsRepo {
    pool: PgPool,
    read_pool: ReadPool,
}

impl UserNotificationSettingsRepo {
    pub fn new(pool: &PgPool, read_pool: &ReadPool) -> Self {
        Self {
            pool: pool.clone(),
            read_pool: read_pool.clone(),
        }
    }

    pub async fn find_for_user_id_for_mut(
        &self,
        user_id: &GaloyUserId,
    ) -> Result<UserNotificationSettings, UserNotificationSettingsError> {
        self.find_for_user_id_inner(user_id, &self.pool).await
    }

    pub async fn find_for_user_id(
        &self,
        user_id: &GaloyUserId,
    ) -> Result<UserNotificationSettings, UserNotificationSettingsError> {
        self.find_for_user_id_inner(user_id, self.read_pool.inner())
            .await
    }

    async fn find_for_user_id_inner(
        &self,
        user_id: &GaloyUserId,
        pool: &PgPool,
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
        .fetch_all(pool)
        .await?;

        let res = EntityEvents::load_first::<UserNotificationSettings>(rows);
        if matches!(res, Err(EntityError::NoEntityEventsPresent)) {
            return Ok(UserNotificationSettings::new(user_id.clone()));
        }
        Ok(res?)
    }

    pub async fn find_for_user_ids(
        &self,
        user_ids: &[GaloyUserId],
    ) -> Result<Vec<UserNotificationSettings>, UserNotificationSettingsError> {
        let mut n_ids = 0;
        let ids = user_ids
            .into_iter()
            .map(|id| {
                n_ids += 1;
                id.to_string()
            })
            .collect::<Vec<_>>();
        let rows = sqlx::query_as!(
            GenericEvent,
            r#"SELECT a.id, e.sequence, e.event,
                      a.created_at AS entity_created_at, e.recorded_at AS event_recorded_at
            FROM user_notification_settings a
            JOIN user_notification_settings_events e ON a.id = e.id
            WHERE a.galoy_user_id = ANY($1)
            ORDER BY a.galoy_user_id, e.sequence"#,
            &ids
        )
        .fetch_all(&self.pool)
        .await?;

        let existing_user_notification_settings =
            EntityEvents::load_n::<UserNotificationSettings>(rows, n_ids)?.0;

        let mut existing_user_notification_settings_map = existing_user_notification_settings
            .into_iter()
            .map(|settings| (settings.galoy_user_id.clone(), settings))
            .collect::<std::collections::HashMap<_, _>>();

        let user_notification_settings_or_default: Vec<UserNotificationSettings> = user_ids
            .into_iter()
            .map(|id| {
                existing_user_notification_settings_map
                    .remove(&id)
                    .unwrap_or_else(|| UserNotificationSettings::new(id.clone()))
            })
            .collect();

        Ok(user_notification_settings_or_default)
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
        self.persist_in_tx(&mut tx, settings).await?;
        tx.commit().await?;
        Ok(())
    }

    pub async fn persist_in_tx(
        &self,
        tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
        settings: &mut UserNotificationSettings,
    ) -> Result<(), UserNotificationSettingsError> {
        sqlx::query!(
            r#"INSERT INTO user_notification_settings (id, galoy_user_id)
            VALUES ($1, $2) ON CONFLICT DO NOTHING"#,
            settings.id as UserNotificationSettingsId,
            settings.galoy_user_id.as_ref(),
        )
        .execute(&mut **tx)
        .await?;
        settings.events.persist(tx).await?;
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
