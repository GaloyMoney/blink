mod config;
mod error;

use sqlx::{Pool, Postgres};

use crate::{account_notification_settings::*, primitives::*};

pub use config::*;
pub use error::*;

#[derive(Clone)]
pub struct NotificationsApp {
    _config: AppConfig,
    _pool: Pool<Postgres>,
}

impl NotificationsApp {
    pub fn new(pool: Pool<Postgres>, config: AppConfig) -> Self {
        Self {
            _config: config,
            _pool: pool,
        }
    }

    pub async fn notification_settings_for_account_id(
        &self,
        _galoy_account_id: GaloyAccountId,
    ) -> Result<AccountNotificationSettings, ApplicationError> {
        unimplemented!()
    }
}
