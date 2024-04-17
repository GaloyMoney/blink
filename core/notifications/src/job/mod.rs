mod config;
mod send_email_notification;
mod send_in_app_notification;
mod send_push_notification;

pub mod error;

use serde::{Deserialize, Serialize};
use sqlxmq::{job, CurrentJob, JobBuilder, JobRegistry, JobRunnerHandle};
use tracing::instrument;
use uuid::{uuid, Uuid};

use std::collections::HashMap;

use job_executor::{JobExecutor, JobResult};

use crate::{
    email_executor::EmailExecutor, email_reminder_projection::*, in_app_executor::InAppExecutor,
    notification_event::*, primitives::GaloyUserId, push_executor::PushExecutor,
    user_notification_settings::*,
};

pub use config::*;
use error::JobError;
use send_email_notification::SendEmailNotificationData;
use send_in_app_notification::SendInAppNotificationData;
use send_push_notification::SendPushNotificationData;

const KICKOFF_LINK_EMAIL_REMINDER_ID: Uuid = uuid!("00000000-0000-0000-0000-000000000001");

pub async fn start_job_runner(
    pool: &sqlx::PgPool,
    push_executor: PushExecutor,
    email_executor: EmailExecutor,
    in_app_executor: InAppExecutor,
    settings: UserNotificationSettingsRepo,
    email_reminder_projection: EmailReminderProjection,
    jobs_config: JobsConfig,
) -> Result<JobRunnerHandle, JobError> {
    let mut registry = JobRegistry::new(&[
        all_user_event_dispatch,
        send_push_notification,
        send_email_notification,
        multi_user_event_dispatch,
        kickoff_link_email_reminder,
        link_email_reminder,
    ]);
    registry.set_context(push_executor);
    registry.set_context(email_executor);
    registry.set_context(settings);
    registry.set_context(email_reminder_projection);
    registry.set_context(jobs_config);
    registry.set_context(in_app_executor);

    Ok(registry.runner(pool).set_keep_alive(false).run().await?)
}

#[job(
    name = "all_user_event_dispatch",
    channel_name = "all_user_event_dispatch"
)]
async fn all_user_event_dispatch(
    mut current_job: CurrentJob,
    settings: UserNotificationSettingsRepo,
) -> Result<(), JobError> {
    let pool = current_job.pool().clone();
    JobExecutor::builder(&mut current_job)
        .build()
        .expect("couldn't build JobExecutor")
        .execute(|data| async move {
            let data: AllUserEventDispatchData =
                data.expect("no AllUserEventDispatchData available");
            let (ids, more) = settings.list_ids_after(&data.search_id).await?;
            let mut tx = pool.begin().await?;
            if more {
                let data = AllUserEventDispatchData {
                    search_id: ids.last().expect("there should always be an id").clone(),
                    payload: data.payload.clone(),
                    tracing_data: tracing::extract_tracing_data(),
                };
                spawn_all_user_event_dispatch(&mut tx, data).await?;
            }
            for user_id in ids {
                let payload = data.payload.clone();
                if payload.should_send_email() {
                    spawn_send_email_notification(&mut tx, (user_id.clone(), payload.clone()))
                        .await?;
                }
                if payload.should_send_in_app_msg() {
                    spawn_send_in_app_notification(&mut tx, (user_id.clone(), payload.clone()))
                        .await?;
                }
                spawn_send_push_notification(&mut tx, (user_id, payload)).await?;
            }
            Ok::<_, JobError>(JobResult::CompleteWithTx(tx))
        })
        .await?;
    Ok(())
}

#[job(name = "link_email_reminder", channel_name = "link_email_reminder")]
async fn link_email_reminder(
    mut current_job: CurrentJob,
    email_reminder_projection: EmailReminderProjection,
) -> Result<(), JobError> {
    let pool = current_job.pool().clone();
    JobExecutor::builder(&mut current_job)
        .build()
        .expect("couldn't build JobExecutor")
        .execute(|data| async move {
            let data: LinkEmailReminderData = data.expect("no LinkEmailReminderData available");
            let mut tx = pool.begin().await?;
            let (ids, more) = email_reminder_projection
                .list_ids_to_notify_after(&mut tx, data.search_id.clone())
                .await?;

            if more {
                let data = LinkEmailReminderData {
                    search_id: ids.last().expect("there should always be an id").clone(),
                    tracing_data: tracing::extract_tracing_data(),
                };
                spawn_link_email_reminder(&mut tx, data).await?;
            }
            for user_id in ids {
                let payload = NotificationEventPayload::from(LinkEmailReminder {});
                if payload.should_send_email() {
                    spawn_send_email_notification(&mut tx, (user_id.clone(), payload.clone()))
                        .await?;
                }
                if payload.should_send_in_app_msg() {
                    spawn_send_in_app_notification(&mut tx, (user_id.clone(), payload.clone()))
                        .await?;
                }
                spawn_send_push_notification(&mut tx, (user_id.clone(), payload.clone())).await?;
            }
            Ok::<_, JobError>(JobResult::CompleteWithTx(tx))
        })
        .await?;
    Ok(())
}

#[job(
    name = "kickoff_link_email_reminder",
    channel_name = "link_email_reminder"
)]
async fn kickoff_link_email_reminder(
    mut current_job: CurrentJob,
    JobsConfig {
        kickoff_link_email_reminder_delay,
    }: JobsConfig,
) -> Result<(), JobError> {
    let pool = current_job.pool().clone();
    JobExecutor::builder(&mut current_job)
        .build()
        .expect("couldn't build JobExecutor")
        .execute(|_: Option<()>| async move {
            let data = LinkEmailReminderData {
                search_id: GaloyUserId::search_begin(),
                tracing_data: tracing::extract_tracing_data(),
            };
            let mut tx = pool.begin().await?;
            spawn_link_email_reminder(&mut tx, data).await?;
            Ok::<_, JobError>(JobResult::CompleteWithTx(tx))
        })
        .await?;
    spawn_kickoff_link_email_reminder(current_job.pool(), kickoff_link_email_reminder_delay)
        .await?;
    Ok(())
}

#[job(
    name = "multi_user_event_dispatch",
    channel_name = "multi_user_event_dispatch"
)]
async fn multi_user_event_dispatch(mut current_job: CurrentJob) -> Result<(), JobError> {
    let pool = current_job.pool().clone();
    JobExecutor::builder(&mut current_job)
        .build()
        .expect("couldn't build JobExecutor")
        .execute(|data| async move {
            let data: MultiUserEventDispatchData =
                data.expect("no MultiUserEventDispatchData available");
            let batch_limit = 1000;
            let (ids, next_user_ids) = data
                .user_ids
                .split_at(std::cmp::min(data.user_ids.len(), batch_limit));

            let mut tx = pool.begin().await?;
            if !next_user_ids.is_empty() {
                let data = MultiUserEventDispatchData {
                    user_ids: next_user_ids.to_vec(),
                    payload: data.payload.clone(),
                    tracing_data: tracing::extract_tracing_data(),
                };
                spawn_multi_user_event_dispatch(&mut tx, data).await?;
            }
            for user_id in ids {
                let payload = data.payload.clone();
                if payload.should_send_email() {
                    spawn_send_email_notification(&mut tx, (user_id.clone(), payload.clone()))
                        .await?;
                }
                if payload.should_send_in_app_msg() {
                    spawn_send_in_app_notification(&mut tx, (user_id.clone(), payload.clone()))
                        .await?;
                }
                spawn_send_push_notification(&mut tx, (user_id.clone(), payload)).await?;
            }
            Ok::<_, JobError>(JobResult::CompleteWithTx(tx))
        })
        .await?;
    Ok(())
}

#[job(
    name = "send_push_notification",
    channel_name = "send_push_notification"
)]
async fn send_push_notification(
    mut current_job: CurrentJob,
    executor: PushExecutor,
) -> Result<(), JobError> {
    JobExecutor::builder(&mut current_job)
        .build()
        .expect("couldn't build JobExecutor")
        .execute(|data| async move {
            let data: SendPushNotificationData =
                data.expect("no SendPushNotificationData available");
            send_push_notification::execute(data, executor).await
        })
        .await?;
    Ok(())
}

#[instrument(name = "job.spawn_send_push_notification", skip_all, fields(error, error.level, error.message), err)]
pub async fn spawn_send_push_notification(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    data: impl Into<SendPushNotificationData>,
) -> Result<(), JobError> {
    let data = data.into();
    if let Err(e) = send_push_notification
        .builder()
        .set_json(&data)
        .expect("Couldn't set json")
        .spawn(&mut **tx)
        .await
    {
        tracing::insert_error_fields(tracing::Level::WARN, &e);
        return Err(e.into());
    }
    Ok(())
}

#[instrument(name = "job.spawn_all_user_event_dispatch", skip_all, fields(error, error.level, error.message), err)]
pub async fn spawn_all_user_event_dispatch(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    data: impl Into<AllUserEventDispatchData>,
) -> Result<(), JobError> {
    let data = data.into();
    if let Err(e) = all_user_event_dispatch
        .builder()
        .set_json(&data)
        .expect("Couldn't set json")
        .spawn(&mut **tx)
        .await
    {
        tracing::insert_error_fields(tracing::Level::WARN, &e);
        return Err(e.into());
    }
    Ok(())
}

#[instrument(name = "job.spawn_multi_user_event_dispatch", skip_all, fields(error, error.level, error.message), err)]
pub async fn spawn_multi_user_event_dispatch(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    data: impl Into<MultiUserEventDispatchData>,
) -> Result<(), JobError> {
    let data = data.into();
    if let Err(e) = multi_user_event_dispatch
        .builder()
        .set_json(&data)
        .expect("Couldn't set json")
        .spawn(&mut **tx)
        .await
    {
        tracing::insert_error_fields(tracing::Level::WARN, &e);
        return Err(e.into());
    }
    Ok(())
}

#[instrument(name = "job.spawn_link_email_reminder", skip_all, fields(error, error.level, error.message), err)]
pub async fn spawn_link_email_reminder(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    data: impl Into<LinkEmailReminderData>,
) -> Result<(), JobError> {
    let data = data.into();
    if let Err(e) = link_email_reminder
        .builder()
        .set_json(&data)
        .expect("Couldn't set json")
        .spawn(&mut **tx)
        .await
    {
        tracing::insert_error_fields(tracing::Level::WARN, &e);
        return Err(e.into());
    }
    Ok(())
}

#[instrument(name = "job.spawn_kickoff_link_email_reminder", skip_all, fields(error, error.level, error.message), err)]
pub async fn spawn_kickoff_link_email_reminder(
    pool: &sqlx::PgPool,
    duration: std::time::Duration,
) -> Result<(), JobError> {
    match JobBuilder::new_with_id(
        KICKOFF_LINK_EMAIL_REMINDER_ID,
        "kickoff_link_email_reminder",
    )
    .set_channel_name("link_email_reminder")
    .set_delay(duration)
    .spawn(pool)
    .await
    {
        Err(sqlx::Error::Database(err)) if err.message().contains("duplicate key") => Ok(()),
        Err(e) => {
            tracing::insert_error_fields(tracing::Level::ERROR, &e);
            Err(e.into())
        }
        Ok(_) => Ok(()),
    }
}

#[job(
    name = "send_email_notification",
    channel_name = "send_email_notification"
)]
async fn send_email_notification(
    mut current_job: CurrentJob,
    executor: EmailExecutor,
) -> Result<(), JobError> {
    JobExecutor::builder(&mut current_job)
        .build()
        .expect("couldn't build JobExecutor")
        .execute(|data| async move {
            let data: SendEmailNotificationData =
                data.expect("no SendEmailNotificationData available");
            send_email_notification::execute(data, executor).await
        })
        .await?;
    Ok(())
}

#[instrument(name = "job.spawn_send_email_notification", skip_all, fields(error, error.level, error.message), err)]
pub async fn spawn_send_email_notification(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    data: impl Into<SendEmailNotificationData>,
) -> Result<(), JobError> {
    let data = data.into();
    if let Err(e) = send_email_notification
        .builder()
        .set_json(&data)
        .expect("Couldn't set json")
        .spawn(&mut **tx)
        .await
    {
        tracing::insert_error_fields(tracing::Level::WARN, &e);
        return Err(e.into());
    }
    Ok(())
}

#[job(
    name = "send_in_app_notification",
    channel_name = "send_in_app_notification"
)]
async fn send_in_app_notification(
    mut current_job: CurrentJob,
    executor: InAppExecutor,
) -> Result<(), JobError> {
    JobExecutor::builder(&mut current_job)
        .build()
        .expect("couldn't build JobExecutor")
        .execute(|data| async move {
            let data: SendInAppNotificationData =
                data.expect("no SendInAppNotificationData available");
            send_in_app_notification::execute(data, executor).await
        })
        .await?;
    Ok(())
}

#[instrument(name = "job.spawn_send_in_app_notification", skip_all, fields(error, error.level, error.message), err)]
pub async fn spawn_send_in_app_notification(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    data: impl Into<SendInAppNotificationData>,
) -> Result<(), JobError> {
    let data = data.into();
    if let Err(e) = send_in_app_notification
        .builder()
        .set_json(&data)
        .expect("Couldn't set json")
        .spawn(&mut **tx)
        .await
    {
        tracing::insert_error_fields(tracing::Level::WARN, &e);
        return Err(e.into());
    }
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct AllUserEventDispatchData {
    search_id: GaloyUserId,
    payload: NotificationEventPayload,
    #[serde(flatten)]
    pub(super) tracing_data: HashMap<String, serde_json::Value>,
}

impl From<NotificationEventPayload> for AllUserEventDispatchData {
    fn from(payload: NotificationEventPayload) -> Self {
        Self {
            search_id: GaloyUserId::search_begin(),
            payload,
            tracing_data: tracing::extract_tracing_data(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct LinkEmailReminderData {
    search_id: GaloyUserId,
    #[serde(flatten)]
    pub(super) tracing_data: HashMap<String, serde_json::Value>,
}

impl From<()> for LinkEmailReminderData {
    fn from(_: ()) -> Self {
        Self {
            search_id: GaloyUserId::search_begin(),
            tracing_data: tracing::extract_tracing_data(),
        }
    }
}

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
            tracing_data: tracing::extract_tracing_data(),
        }
    }
}
