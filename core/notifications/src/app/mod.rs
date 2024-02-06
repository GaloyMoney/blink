mod config;
pub mod error;

use sqlx::{Pool, Postgres};
use tracing::instrument;

use crate::{executor::*, notification_event::*, primitives::*, user_notification_settings::*};

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct NotificationsApp {
    _config: AppConfig,
    settings: UserNotificationSettingsRepo,
    executor: Executor,
    _pool: Pool<Postgres>,
}

impl NotificationsApp {
    pub async fn init(pool: Pool<Postgres>, config: AppConfig) -> Result<Self, ApplicationError> {
        let settings = UserNotificationSettingsRepo::new(&pool);
        let executor = Executor::init(config.exectuor.clone(), settings.clone()).await?;
        Ok(Self {
            _config: config,
            _pool: pool,
            executor,
            settings,
        })
    }

    #[instrument(name = "app.should_send_notification", skip(self), ret, err)]
    pub async fn should_send_notification(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
        category: UserNotificationCategory,
    ) -> Result<bool, ApplicationError> {
        let user_settings = self.settings.find_for_user_id(&user_id).await?;
        Ok(user_settings.should_send_notification(channel, category))
    }

    #[instrument(name = "app.notification_settings_for_user", skip(self), err)]
    pub async fn notification_settings_for_user(
        &self,
        user_id: GaloyUserId,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let user_settings = self.settings.find_for_user_id(&user_id).await?;

        Ok(user_settings)
    }

    #[instrument(name = "app.disable_channel_on_user", skip(self), err)]
    pub async fn disable_channel_on_user(
        &self,
        user_id: GaloyUserId,
        channel: UserNotificationChannel,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings = self.settings.find_for_user_id(&user_id).await?;
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
        let mut user_settings = self.settings.find_for_user_id(&user_id).await?;

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
        let mut user_settings = self.settings.find_for_user_id(&user_id).await?;
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
        let mut user_settings = self.settings.find_for_user_id(&user_id).await?;
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
        let mut user_settings = self.settings.find_for_user_id(&user_id).await?;
        if locale.is_empty() {
            user_settings.set_locale_to_default()
        } else {
            user_settings.update_locale(GaloyLocale::from(locale));
        }
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }

    #[instrument(name = "app.add_push_device_token", skip(self), err)]
    pub async fn add_push_device_token(
        &self,
        user_id: GaloyUserId,
        device_token: PushDeviceToken,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings = self.settings.find_for_user_id(&user_id).await?;
        user_settings.add_push_device_token(device_token);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }

    #[instrument(name = "app.remove_push_device_token", skip(self), err)]
    pub async fn remove_push_device_token(
        &self,
        user_id: GaloyUserId,
        device_token: PushDeviceToken,
    ) -> Result<UserNotificationSettings, ApplicationError> {
        let mut user_settings = self.settings.find_for_user_id(&user_id).await?;
        user_settings.remove_push_device_token(device_token);
        self.settings.persist(&mut user_settings).await?;
        Ok(user_settings)
    }

    #[instrument(name = "app.handle_circle_grew", skip(self), err)]
    pub async fn handle_circle_grew(&self, event: CircleGrew) -> Result<(), ApplicationError> {
        self.executor.notify(event).await?;
        Ok(())
    }

    #[instrument(name = "app.handle_threshold_reached", skip(self), err)]
    pub async fn handle_threshold_reached(
        &self,
        event: CircleThresholdReached,
    ) -> Result<(), ApplicationError> {
        self.executor.notify(event).await?;
        Ok(())
    }
}
