mod send_email_notification;
mod send_push_notification;

pub mod error;

use sqlxmq::{job, CurrentJob, JobRegistry, JobRunnerHandle};
use tracing::instrument;

use job_executor::JobExecutor;

use crate::{email_executor::EmailExecutor, push_executor::PushExecutor};

use error::JobError;

use send_email_notification::SendEmailNotificationData;
use send_push_notification::SendPushNotificationData;

pub async fn start_job_runner(
    pool: &sqlx::PgPool,
    push_executor: PushExecutor,
    email_executor: EmailExecutor,
) -> Result<JobRunnerHandle, JobError> {
    let mut registry = JobRegistry::new(&[send_push_notification, send_email_notification]);
    registry.set_context(push_executor);
    registry.set_context(email_executor);

    Ok(registry.runner(pool).set_keep_alive(false).run().await?)
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
