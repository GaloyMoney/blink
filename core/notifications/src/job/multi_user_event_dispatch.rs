use serde::{Deserialize, Serialize};
use tracing::instrument;

use std::collections::HashMap;

use crate::{
    history::NotificationHistory, notification_event::NotificationEventPayload,
    primitives::GaloyUserId,
};
use job_executor::JobResult;

use super::error::JobError;

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct MultiUserEventDispatchData {
    user_ids: Vec<GaloyUserId>,
    payload: NotificationEventPayload,
    #[serde(flatten)]
    pub(super) tracing_data: HashMap<String, serde_json::Value>,
}

impl From<(Vec<GaloyUserId>, NotificationEventPayload)> for MultiUserEventDispatchData {
    fn from((user_ids, payload): (Vec<GaloyUserId>, NotificationEventPayload)) -> Self {
        Self {
            user_ids,
            payload,
            tracing_data: HashMap::default(),
        }
    }
}

#[instrument(
    name = "job.multi_user_event_dispatch",
    skip(history, pool),
    fields(first_id, last_id, ids_len, next_ids_len),
    err
)]
pub async fn execute(
    data: MultiUserEventDispatchData,
    history: NotificationHistory,
    pool: sqlx::PgPool,
) -> Result<JobResult, JobError> {
    let batch_limit = 10;
    let (ids, next_user_ids) = data
        .user_ids
        .split_at(std::cmp::min(data.user_ids.len(), batch_limit));
    let span = tracing::Span::current();
    if ids.len() > 0 {
        span.record("first_id", &tracing::field::display(&ids[0]));
        span.record("last_id", &tracing::field::display(&ids[ids.len() - 1]));
        span.record("ids_len", &tracing::field::display(ids.len()));
        span.record(
            "next_ids_len",
            &tracing::field::display(next_user_ids.len()),
        );
    }
    println!(
        "multi_user_event_dispatch: {}, {}",
        ids[0],
        ids[ids.len() - 1]
    );
    let mut tx = pool.begin().await?;
    if !next_user_ids.is_empty() {
        let data = MultiUserEventDispatchData {
            user_ids: next_user_ids.to_vec(),
            payload: data.payload.clone(),
            tracing_data: HashMap::default(),
        };
        super::spawn_multi_user_event_dispatch(&mut tx, data).await?;
    }

    let payload = data.payload.clone();

    history.add_events(&mut tx, ids, payload.clone()).await?;

    for user_id in ids {
        if payload.should_send_email() {
            super::spawn_send_email_notification(&mut tx, (user_id.clone(), payload.clone()))
                .await?;
        }
        if payload.should_send_push() {
            super::spawn_send_push_notification(&mut tx, (user_id.clone(), payload.clone()))
                .await?;
        }
    }
    Ok::<_, JobError>(JobResult::CompleteWithTx(tx))
}
