mod config;
pub mod error;
use novu::{events::*, subscriber::*, Novu};
use std::collections::HashMap;

pub use config::*;
use error::*;

pub struct NovuExecutor {
    client: novu::Novu,
}

impl NovuExecutor {
    pub fn init(config: NovuConfig) -> Result<Self, NovuExecutorError> {
        Ok(Self {
            client: Novu::new(config.api_key, None)?,
        })
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

    pub async fn update_subscriber(
        &self,
        subscriber_id: String,
        payload: SubscriberPayload,
    ) -> Result<(), NovuExecutorError> {
        self.client
            .subscribers
            .update(subscriber_id.clone(), payload)
            .await?;
        Ok(())
    }

    pub async fn get_subscriber(
        &self,
        subscriber_id: String,
    ) -> Result<GetSubscriberResponse, NovuExecutorError> {
        let response = self
            .client
            .subscribers
            .get_subscriber(subscriber_id)
            .await?;
        Ok(response)
    }

    pub async fn create_subscriber(
        &self,
        payload: CreateSubscriberPayload,
    ) -> Result<(), NovuExecutorError> {
        self.client.subscribers.create(payload).await?;
        Ok(())
    }
}
