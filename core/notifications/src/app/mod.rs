mod config;
pub mod error;

use sqlx::{Pool, Postgres};
use tracing::instrument;

use crate::{primitives::*, user_notification_settings::*};

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct NotificationsApp {
    _config: AppConfig,
    settings: UserNotificationSettingsRepo,
    _pool: Pool<Postgres>,
}

impl NotificationsApp {
    pub fn new(pool: Pool<Postgres>, config: AppConfig) -> Self {
        let settings = UserNotificationSettingsRepo::new(&pool);
        Self {
            _config: config,
            _pool: pool,
            settings,
        }
    }

    #[instrument(name = "app.should_send_notification", skip(self), ret, err)]
    pub async fn should_send_notification(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    ) -> Result<bool, ApplicationError> {
        let user_settings = self
            .settings
            .find_for_user_id(&user_id)
            .await?
            .unwrap_or_else(|| UserNotificationSettings::new(user_id.clone()));
        Ok(user_settings.should_send_notification(channel, category))
    }

    #[instrument(name = "app.notification_settings_for_user", skip(self), err)]
    pub async fn notification_settings_for_user(
        &self,
        user_id: GaloyUserId,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let user_settings = self
            .settings
            .find_for_user_id(&user_id)
            .await?
            .unwrap_or_else(|| UserNotificationSettings::new(user_id));

        Ok(user_settings)
    }

    #[instrument(name = "app.disable_channel_on_user", skip(self), err)]
    pub async fn disable_channel_on_user(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings = self
            .settings
            .find_for_user_id(&user_id)
            .await?
            .unwrap_or_else(|| UserNotificationSettings::new(user_id));
        user_settings.disable_channel(channel);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }

    #[instrument(name = "app.enable_channel_on_user", skip(self), err)]
    pub async fn enable_channel_on_user(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings = self
            .settings
            .find_for_user_id(&user_id)
            .await?
            .unwrap_or_else(|| UserNotificationSettings::new(user_id));

        user_settings.enable_channel(channel);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }

    #[instrument(name = "app.disable_category_on_user", skip(self), err)]
    pub async fn disable_category_on_user(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings = self
            .settings
            .find_for_user_id(&user_id)
            .await?
            .unwrap_or_else(|| UserNotificationSettings::new(user_id));
        user_settings.disable_category(channel, category);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }

    #[instrument(name = "app.enable_category_on_user", skip(self), err)]
    pub async fn enable_category_on_user(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings = self
            .settings
            .find_for_user_id(&user_id)
            .await?
            .unwrap_or_else(|| UserNotificationSettings::new(user_id));
        user_settings.enable_category(channel, category);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }

    #[instrument(name = "app.update_user_locale", skip(self), err)]
    pub async fn update_locale_on_user(
        &self,
        user_id: GaloyUserId,
        locale: String,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings = self
            .settings
            .find_for_user_id(&user_id)
            .await?
            .unwrap_or_else(|| UserNotificationSettings::new(user_id));
        user_settings.update_locale(locale);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }
}
