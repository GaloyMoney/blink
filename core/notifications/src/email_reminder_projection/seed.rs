use sqlx::PgPool;

use super::{error::*, EmailReminderProjection};

use crate::{primitives::GaloyUserId, user_notification_settings::*};

pub async fn seed(
    pool: &PgPool,
    settings: UserNotificationSettingsRepo,
    state: EmailReminderProjection,
) -> Result<(), EmailReminderProjectionError> {
    let mut next_search_id = GaloyUserId::search_begin();
    loop {
        let (settings, more) = settings.list_after_id(&next_search_id).await?;
        if let Some(last) = settings.last() {
            next_search_id = last.galoy_user_id.clone();
        }

        let mut tx = pool.begin().await?;
        for setting in settings {
            if let (Some(created_at), None) = (setting.created_at(), setting.email_address()) {
                state
                    .new_user_without_email(&mut tx, setting.galoy_user_id, created_at)
                    .await?;
            }
        }

        if !more {
            break;
        }
    }
    Ok(())
}
