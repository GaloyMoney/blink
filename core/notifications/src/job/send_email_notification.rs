use serde::{Deserialize, Serialize};
use tracing::instrument;

use std::collections::HashMap;

use super::error::JobError;
use crate::{
    email_executor::EmailExecutor, notification_event::NotificationEventPayload,
    primitives::GaloyUserId,
};

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct SendEmailNotificationData {
    user_id: GaloyUserId,
    payload: NotificationEventPayload,
    #[serde(flatten)]
    pub(super) tracing_data: HashMap<String, serde_json::Value>,
}

impl From<(GaloyUserId, NotificationEventPayload)> for SendEmailNotificationData {
    fn from((user_id, payload): (GaloyUserId, NotificationEventPayload)) -> Self {
        Self {
            user_id,
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
    let payload = data.payload.clone();
    executor
        .notify(&data.user_id, payload.as_notification_event())
        .await?;
    Ok(data)
}
