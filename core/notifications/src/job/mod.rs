mod send_push_notification;

pub mod error;

use sqlxmq::{job, CurrentJob, JobBuilder, JobRegistry, JobRunnerHandle};
use tracing::instrument;

use job_executor::JobExecutor;

use error::JobError;

use send_push_notification::SendPushNotificationData;

pub async fn start_job_runner(pool: &sqlx::PgPool) -> Result<JobRunnerHandle, JobError> {
    let mut registry = JobRegistry::new(&[
        // sync_all_wallets,
        // sync_wallet,
        // process_all_payout_queues,
        // schedule_process_payout_queue,
        // process_payout_queue,
        // batch_wallet_accounting,
        // batch_signing,
        // batch_broadcasting,
        // respawn_all_outbox_handlers,
        // populate_outbox,
    ]);

    Ok(registry.runner(pool).set_keep_alive(false).run().await?)
}

#[job(
    name = "send_push_notification",
    channel_name = "send_push_notification"
)]
async fn send_push_notification(mut current_job: CurrentJob) -> Result<(), JobError> {
    JobExecutor::builder(&mut current_job)
        .build()
        .expect("couldn't build JobExecutor")
        .execute(|data| async move {
            let data: SendPushNotificationData = data.expect("no BatchBroadcastingData available");
            send_push_notification::execute(data).await
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
