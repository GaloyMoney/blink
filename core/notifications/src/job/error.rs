use thiserror::Error;

use crate::{email_executor::error::EmailExecutorError, push_executor::error::PushExecutorError};

#[derive(Error, Debug)]
pub enum JobError {
    #[error("JobError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("JobError - PushExecutorError: {0}")]
    PushExecutor(#[from] PushExecutorError),
    #[error("JobError - EmailExecutorError: {0}")]
    EmailExecutor(#[from] EmailExecutorError),
}

impl job_executor::JobExecutionError for JobError {}
