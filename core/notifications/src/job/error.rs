use thiserror::Error;

#[derive(Error, Debug)]
pub enum JobError {
    #[error("JobError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
}

impl job_executor::JobExecutionError for JobError {}
