mod config;
pub mod error;

use sqlx::{Pool, Postgres};
use sqlxmq::JobRunnerHandle;
use tracing::instrument;

use std::sync::Arc;

use crate::{
    email_executor::EmailExecutor, job, notification_event::*, primitives::*, push_executor::*,
    user_notification_settings::*,
};

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct NotificationsApp {
    _config: AppConfig,
    settings: UserNotificationSettingsRepo,
    pool: Pool<Postgres>,
    _runner: Arc<JobRunnerHandle>,
}

impl NotificationsApp {
    pub async fn init(pool: Pool<Postgres>, config: AppConfig) -> Result<Self, ApplicationError> {
        let settings = UserNotificationSettingsRepo::new(&pool);
        let push_executor =
            PushExecutor::init(config.push_executor.clone(), settings.clone()).await?;
        let email_executor = EmailExecutor::init(config.email_executor.clone(), settings.clone())?;
        let runner =
            job::start_job_runner(&pool, push_executor, email_executor, settings.clone()).await?;
        Ok(Self {
            _config: config,
            pool,
            settings,
            _runner: Arc::new(runner),
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

    #[instrument(name = "app.update_email_address", skip(self), err)]
    pub async fn update_email_address(
        &self,
        user_id: GaloyUserId,
        addr: GaloyEmailAddress,
    ) -> Result<(), ApplicationError> {
        let mut user_settings = self.settings.find_for_user_id(&user_id).await?;
        user_settings.update_email_address(addr);
        self.settings.persist(&mut user_settings).await?;
        Ok(())
    }

    #[instrument(name = "app.remove_email_address", skip(self), err)]
    pub async fn remove_email_address(&self, user_id: GaloyUserId) -> Result<(), ApplicationError> {
        let mut user_settings = self.settings.find_for_user_id(&user_id).await?;
        user_settings.remove_email_address();
        self.settings.persist(&mut user_settings).await?;
        Ok(())
    }

    #[instrument(name = "app.handle_single_user_event", skip(self), err)]
    pub async fn handle_single_user_event<T: NotificationEvent>(
        &self,
        user_id: GaloyUserId,
        event: T,
    ) -> Result<(), ApplicationError>
    where
        NotificationEventPayload: From<T>,
    {
        let mut tx = self.pool.begin().await?;
        if event.should_send_email() {
            job::spawn_send_email_notification(
                &mut tx,
                (
                    user_id.clone(),
                    NotificationEventPayload::from(event.clone()),
                ),
            )
            .await?;
        }
        job::spawn_send_push_notification(
            &mut tx,
            (user_id, NotificationEventPayload::from(event)),
        )
        .await?;
        tx.commit().await?;
        Ok(())
    }

    #[instrument(name = "app.handle_notification_event", skip(self), err)]
    pub async fn handle_notification_event<T: NotificationEvent>(
        &self,
        event: T,
    ) -> Result<(), ApplicationError>
    where
        NotificationEventPayload: From<T>,
    {
        let mut tx = self.pool.begin().await?;
        job::spawn_multi_user_event_dispatch(&mut tx, NotificationEventPayload::from(event))
            .await?;
        tx.commit().await?;
        Ok(())
    }
}
