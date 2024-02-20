use serde::{Deserialize, Serialize};
use tracing::instrument;

use std::collections::HashMap;

use super::error::JobError;
use crate::{email_executor::EmailExecutor, notification_event::NotificationEventPayload};

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct SendEmailNotificationData {
    payload: NotificationEventPayload,
    #[serde(flatten)]
    pub(super) tracing_data: HashMap<String, serde_json::Value>,
}

impl From<NotificationEventPayload> for SendEmailNotificationData {
    fn from(payload: NotificationEventPayload) -> Self {
        Self {
            payload,
            tracing_data: tracing::extract_tracing_data(),
        }
    }
}

#[instrument(name = "job.send_email_notification", skip(executor), err)]
pub async fn execute(
    data: SendEmailNotificationData,
    executor: EmailExecutor,
) -> Result<SendEmailNotificationData, JobError> {
    executor.notify(&data.payload).await?;
    Ok(data)
}
