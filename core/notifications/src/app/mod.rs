mod config;
mod error;

use sqlx::{Pool, Postgres};

use crate::{user_notification_settings::*, primitives::*};

pub use config::*;
pub use error::*;

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

    pub async fn notification_settings_for_user(
        &self,
        user_id: GaloyUserId,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        if let Some(settings) = self.settings.find_for_user_id(&user_id).await? {
            Ok(settings)
        } else {
            Ok(UserNotificationSettings::new(user_id))
        }
    }

    pub async fn disable_channel_on_user(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings =
            if let Some(settings) = self.settings.find_for_user_id(&user_id).await? {
                settings
            } else {
                UserNotificationSettings::new(user_id)
            };
        user_settings.disable_channel(channel);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }

    pub async fn enable_channel_on_user(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings =
            if let Some(settings) = self.settings.find_for_user_id(&user_id).await? {
                settings
            } else {
                UserNotificationSettings::new(user_id)
            };
            
        user_settings.enable_channel(channel);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }

    pub async fn disable_category_on_user(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings =
            if let Some(settings) = self.settings.find_for_user_id(&user_id).await? {
                settings
            } else {
                UserNotificationSettings::new(user_id)
            };
        user_settings.disable_category(channel, category);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }

    pub async fn enable_category_on_user(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings =
            if let Some(settings) = self.settings.find_for_user_id(&user_id).await? {
                settings
            } else {
                UserNotificationSettings::new(user_id)
            };
        user_settings.enable_category(channel, category);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }
}
