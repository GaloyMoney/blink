use thiserror::Error;

use crate::{
    email_executor::error::EmailExecutorError, push_executor::error::PushExecutorError,
    user_notification_settings::error::*, user_transaction_tracker::UserTransactionTrackerError,
};

#[derive(Error, Debug)]
pub enum JobError {
    #[error("JobError - Sqlx: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("JobError - UserNotificationSettings: {0}")]
    UserNotificationSettings(#[from] UserNotificationSettingsError),
    #[error("JobError - PushExecutorError: {0}")]
    PushExecutor(#[from] PushExecutorError),
    #[error("JobError - EmailExecutorError: {0}")]
    EmailExecutor(#[from] EmailExecutorError),
    #[error("JobError - UserTransactionTracker: {0}")]
    UserTransactionTracker(#[from] UserTransactionTrackerError),
}

impl job_executor::JobExecutionError for JobError {}
