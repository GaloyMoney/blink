mod config;
pub mod error;

use novu::{events::*, Novu};
use std::collections::HashMap;

pub use config::*;
use error::*;

#[allow(dead_code)]
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
        // let client = Novu::new(std::env::var("NOVU_API_KEY").unwrap(), None)?;
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
}
