use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde_with::serde_as]
pub struct JobsConfig {
    #[serde_as(as = "serde_with::DurationSeconds<u64>")]
    #[serde(default = "default_link_email_reminder_delay")]
    pub link_email_reminder_delay: Duration,
}

impl Default for JobsConfig {
    fn default() -> Self {
        Self {
            link_email_reminder_delay: default_link_email_reminder_delay(),
        }
    }
}

fn default_link_email_reminder_delay() -> Duration {
    Duration::from_secs(21 * 24 * 60 * 60)
}
