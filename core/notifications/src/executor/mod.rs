mod config;
pub mod error;
mod novu;

use novu::{events::*, subscriber::*, NovuClient};
use std::collections::HashMap;

use crate::{notification_event::*, primitives::*, user_notification_settings::*};

pub use config::*;
use error::*;
pub use novu::events::AllowedPayloadValues;

#[derive(Clone)]
pub struct Executor {
    config: NovuConfig,
    client: NovuClient,
    settings: UserNotificationSettingsRepo,
}

impl Executor {
    pub fn init(
        config: NovuConfig,
        settings: UserNotificationSettingsRepo,
    ) -> Result<Self, ExecutorError> {
        Ok(Self {
            client: NovuClient::new(config.api_key.clone(), None)?,
            config,
            settings,
        })
    }

    pub async fn notify<T: NotificationEvent>(&self, event: T) -> Result<(), ExecutorError> {
        let settings = self.settings.find_for_user_id(event.user_id()).await?;
        if !settings.should_send_notification(
            UserNotificationChannel::Push,
            UserNotificationCategory::Circles,
        ) {
            return Ok(());
        }

        self.create_subscriber_for_galoy_id(event.user_id()).await?;
        self.update_push_credentials(event.user_id(), &settings.push_device_tokens())
            .await?;

        let user_id = event.user_id().to_string();
        let payload = event.into_payload();

        let id = self
            .config
            .workflows
            .for_name(<T as NotificationEvent>::workflow_name());

        self.trigger_workflow(user_id, id, payload).await?;

        Ok(())
    }

    async fn trigger_workflow(
        &self,
        user_id: String,
        trigger_name: String,
        payload_data: HashMap<String, AllowedPayloadValues>,
    ) -> Result<(), ExecutorError> {
        self.client
            .trigger(TriggerPayload {
                name: trigger_name,
                payload: payload_data,
                to: TriggerRecipientsType::Single(TriggerRecipientBuilder::new(user_id).build()),
            })
            .await?;

        Ok(())
    }

    async fn update_push_credentials(
        &self,
        user_id: &GaloyUserId,
        push_device_tokens: impl IntoIterator<Item = &PushDeviceToken>,
    ) -> Result<(), ExecutorError> {
        self.client
            .subscribers
            .update_credentials(
                user_id.to_string(),
                UpdateCredentialsPayload {
                    provider_id: ProviderId::PushWebhook,
                    integration_identifier: None,
                    credentials: Credentials {
                        webhook_url: "".to_string(),
                        device_tokens: Some(
                            push_device_tokens
                                .into_iter()
                                .map(|t| t.to_string())
                                .collect(),
                        ),
                        channel: None,
                        title: None,
                        image_url: None,
                        alert_uid: None,
                        state: None,
                        external_url: None,
                    },
                },
            )
            .await?;
        Ok(())
    }

    pub async fn trigger_email_workflow(
        &self,
        trigger_name: String,
        recipient_email: String,
        recipient_id: String,
    ) -> Result<(), ExecutorError> {
        let payload = HashMap::new();
        self.client
            .trigger(TriggerPayload {
                name: trigger_name,
                payload,
                to: TriggerRecipientsType::Single(
                    TriggerRecipientBuilder::new(recipient_id)
                        .email(recipient_email)
                        .build(),
                ),
            })
            .await?;
        Ok(())
    }

    async fn create_subscriber_for_galoy_id(
        &self,
        user_id: &GaloyUserId,
    ) -> Result<(), ExecutorError> {
        self.client
            .subscribers
            .create(CreateSubscriberPayload {
                first_name: None,
                last_name: None,
                email: None,
                phone: None,
                avatar: None,
                subscriber_id: user_id.to_string(),
                data: None,
            })
            .await?;
        Ok(())
    }
}
