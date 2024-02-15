use thiserror::Error;

use crate::push_executor::error::PushExecutorError;

#[derive(Error, Debug)]
pub enum JobError {
    #[error("JobError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("JobError - ExecutorError: {0}")]
    PushExecutor(#[from] PushExecutorError),
}

impl job_executor::JobExecutionError for JobError {}
