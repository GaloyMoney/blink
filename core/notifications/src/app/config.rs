use serde::{Deserialize, Serialize};

use crate::{
    email_executor::EmailExecutorConfig, email_reminder_projection::EmailReminderProjectionConfig,
    job::JobsConfig, push_executor::PushExecutorConfig,
};

#[derive(Clone, Default, Serialize, Deserialize)]
pub struct AppConfig {
    pub push_executor: PushExecutorConfig,
    #[serde(default)]
    pub email_executor: EmailExecutorConfig,
    #[serde(default)]
    pub jobs: JobsConfig,
    #[serde(default)]
    pub link_email_reminder: EmailReminderProjectionConfig,
}
