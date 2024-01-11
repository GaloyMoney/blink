mod config;
mod error;

use sqlx::{Pool, Postgres};

use crate::{account_notification_settings::*, primitives::*};

pub use config::*;
pub use error::*;

#[derive(Clone)]
pub struct NotificationsApp {
    _config: AppConfig,
    settings: AccountNotificationSettingsRepo,
    _pool: Pool<Postgres>,
}

impl NotificationsApp {
    pub fn new(pool: Pool<Postgres>, config: AppConfig) -> Self {
        let settings = AccountNotificationSettingsRepo::new(&pool);
        Self {
            _config: config,
            _pool: pool,
            settings,
        }
    }

    pub async fn disable_channel_on_account(
        &self,
        account_id: GaloyAccountId,
        channel: NotificationChannel,
    ) -> Result<AccountNotificationSettings, ApplicationError> {
        let mut account_settings =
            if let Some(settings) = self.settings.find_for_account_id(&account_id).await? {
                settings
            } else {
                AccountNotificationSettings::new(account_id)
            };
        account_settings.disable_channel(channel);
        self.settings.persist(&mut account_settings).await?;
        Ok(account_settings)
    }
}
