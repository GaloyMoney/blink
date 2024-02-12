use serde::{Deserialize, Serialize};
use tracing::instrument;

use std::collections::HashMap;

use super::error::JobError;
use crate::notification_event::NotificationEventPayload;

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct SendPushNotificationData {
    payload: NotificationEventPayload,
    #[serde(flatten)]
    pub(super) tracing_data: HashMap<String, String>,
}

impl From<NotificationEventPayload> for SendPushNotificationData {
    fn from(payload: NotificationEventPayload) -> Self {
        Self {
            payload,
            tracing_data: tracing::extract_tracing_data(),
        }
    }
}

#[instrument(name = "job.send_push_notification", err)]
pub async fn execute(data: SendPushNotificationData) -> Result<SendPushNotificationData, JobError> {
    Ok(data)
}
