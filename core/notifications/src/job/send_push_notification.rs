use serde::{Deserialize, Serialize};
use tracing::instrument;

use std::collections::HashMap;

use super::error::JobError;
use crate::{
    notification_event::NotificationEventPayload, primitives::GaloyUserId,
    push_executor::PushExecutor,
};

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct SendPushNotificationData {
    user_id: GaloyUserId,
    payload: NotificationEventPayload,
    #[serde(flatten)]
    pub(super) tracing_data: HashMap<String, serde_json::Value>,
}

impl From<(GaloyUserId, NotificationEventPayload)> for SendPushNotificationData {
    fn from((user_id, payload): (GaloyUserId, NotificationEventPayload)) -> Self {
        Self {
            user_id,
            payload,
            tracing_data: tracing::extract_tracing_data(),
        }
    }
}

#[instrument(name = "job.send_push_notification", skip(executor), err)]
pub async fn execute(
    data: SendPushNotificationData,
    executor: PushExecutor,
) -> Result<SendPushNotificationData, JobError> {
    let payload = data.payload.clone();
    executor
        .notify(&data.user_id, payload.as_notification_event())
        .await?;
    Ok(data)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{notification_event::*, primitives::*};
    use serde::{Deserialize, Serialize};

    #[derive(Default, Debug, Serialize, Deserialize)]
    struct JobMeta {
        attempts: u32,
        tracing_data: Option<HashMap<String, String>>,
    }

    #[derive(Debug, Deserialize, Serialize)]
    struct JobData<T: std::fmt::Debug> {
        #[serde(rename = "_job_meta", default)]
        job_meta: JobMeta,
        #[serde(flatten)]
        data: Option<T>,
        #[serde(flatten)]
        tracing_data: HashMap<String, serde_json::Value>,
    }

    #[test]
    fn job_data_round_trip() {
        let tracing_data = vec![
            (
                "tracestate".to_string(),
                serde_json::Value::String("".to_string()),
            ),
            (
                "traceparent".to_string(),
                serde_json::Value::String(
                    "00-2da747b31646aadf7aa11efacba7aad1-f1d9a1f51961dee0-01".to_string(),
                ),
            ),
        ]
        .into_iter()
        .collect();

        let payload = NotificationEventPayload::CircleGrew(CircleGrew {
            circle_type: CircleType::Outer,
            this_month_circle_size: 1,
            all_time_circle_size: 1,
        });
        let raw = SendPushNotificationData {
            user_id: GaloyUserId::from("172437af-e8c3-4df7-9859-148dea00bf33".to_string()),
            payload,
            tracing_data,
        };
        let data = serde_json::to_string(&raw).unwrap();
        let job_data: JobData<SendPushNotificationData> = serde_json::from_str(&data).unwrap();
        assert!(job_data.data.is_some());
        assert_eq!(job_data.tracing_data.len(), 4);
    }
}
