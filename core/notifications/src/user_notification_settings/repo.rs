use sqlx::PgPool;

use es_entity::*;

use super::{entity::*, error::*};
use crate::primitives::*;

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
    ) -> Result<Option<UserNotificationSettings>, UserNotificationSettingsError> {
        let rows = sqlx::query_as!(
            GenericEvent,
            r#"SELECT a.id, e.sequence, e.event
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
            return Ok(None);
        }
        Ok(Some(res?))
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
}
