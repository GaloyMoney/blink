use thiserror::Error;

use crate::executor::error::ExecutorError;

#[derive(Error, Debug)]
pub enum JobError {
    #[error("JobError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("JobError - ExecutorError: {0}")]
    Executor(#[from] ExecutorError),
}

impl job_executor::JobExecutionError for JobError {}
