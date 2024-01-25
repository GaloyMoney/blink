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
        // self.add_push_notification_credentials(
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
