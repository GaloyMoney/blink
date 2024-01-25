mod config;
pub mod error;

use novu::{events::*, subscriber::*, Novu};
use std::collections::HashMap;

use crate::{notification_event::*, primitives::*, user_notification_settings::*};

pub use config::*;
use error::*;

#[derive(Clone)]
pub struct NovuExecutor {
    client: novu::Novu,
    settings: UserNotificationSettingsRepo,
}

impl NovuExecutor {
    pub fn init(
        config: NovuConfig,
        settings: UserNotificationSettingsRepo,
    ) -> Result<Self, NovuExecutorError> {
        Ok(Self {
            client: Novu::new(config.api_key, None)?,
            settings,
        })
    }

    pub async fn notify_circle_grew(&self, event: CircleGrew) -> Result<(), NovuExecutorError> {
        let settings = self.settings.find_for_user_id(&event.user_id).await?;
        if !settings.should_send_notification(
            UserNotificationChannel::Push,
            UserNotificationCategory::Circles,
        ) {
            return Ok(());
        }
        self.create_subscriber_for_galoy_id(&event.user_id).await?;
        self.update_push_credentials(&event.user_id, &settings.push_device_tokens())
            .await?;

        let payload_data: HashMap<String, AllowedPayloadValues> = ([
            (
                format!("circle_type"),
                AllowedPayloadValues::STRING(event.circle_type.to_string()),
            ),
            (
                format!("this_month_circle_size"),
                AllowedPayloadValues::NUMBER(event.this_month_circle_size as i32),
            ),
        ])
        .into_iter()
        .collect();

        self.trigger_workflow(&event.user_id, String::from("rust-push-test"), payload_data)
            .await?;

        Ok(())
    }

    async fn trigger_workflow(
        &self,
        user_id: &GaloyUserId,
        trigger_name: String,
        payload_data: HashMap<String, AllowedPayloadValues>,
    ) -> Result<(), NovuExecutorError> {
        self.client
            .trigger(novu::events::TriggerPayload {
                name: trigger_name,
                payload: payload_data,
                to: TriggerRecipientsType::Single(
                    TriggerRecipientBuilder::new(user_id.to_string()).build(),
                ),
            })
            .await?;

        Ok(())
    }

    async fn update_push_credentials(
        &self,
        user_id: &GaloyUserId,
        push_device_tokens: impl IntoIterator<Item = &PushDeviceToken>,
    ) -> Result<(), NovuExecutorError> {
        self.client
            .subscribers
            .update_credentials(
                user_id.to_string(),
                UpdateCredentialsPayload {
                    provider_id: "firebase-cloud-messaging-qTItb8E6-".to_string(),
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
    ) -> Result<(), NovuExecutorError> {
        let payload = HashMap::new();
        self.client
            .trigger(novu::events::TriggerPayload {
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
    ) -> Result<(), NovuExecutorError> {
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
