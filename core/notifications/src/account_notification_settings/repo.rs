use sqlx::PgPool;

use es_entity::*;

use super::{entity::*, error::*};
use crate::primitives::*;

#[derive(Debug, Clone)]
pub struct AccountNotificationSettingsRepo {
    pool: PgPool,
}

impl AccountNotificationSettingsRepo {
    pub fn new(pool: &PgPool) -> Self {
        Self { pool: pool.clone() }
    }

    pub async fn find_for_account_id(
        &self,
        account_id: GaloyAccountId,
    ) -> Result<Option<AccountNotificationSettings>, AccountNotificationSettingsError> {
        let rows = sqlx::query_as!(
            GenericEvent,
            r#"SELECT a.id, e.sequence, e.event
            FROM account_notification_settings a
            JOIN account_notification_settings_events e ON a.id = e.id
            WHERE a.galoy_account_id = $1
            ORDER BY e.sequence"#,
            account_id.as_ref(),
        )
        .fetch_all(&self.pool)
        .await?;
        let res = EntityEvents::load_first::<AccountNotificationSettings>(rows);
        if matches!(res, Err(EntityError::NoEntityEventsPresent)) {
            return Ok(None);
        }
        Ok(Some(res?))
    }
}
