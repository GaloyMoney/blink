pub mod error;

use sqlxmq::{job, CurrentJob, JobBuilder, JobRegistry, JobRunnerHandle};

use error::JobError;

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
