use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde_with::serde_as]
pub struct JobsConfig {
    #[serde_as(as = "serde_with::DurationSeconds<u64>")]
    #[serde(default = "default_kickoff_link_email_reminder_delay")]
    pub kickoff_link_email_reminder_delay: Duration,
}

impl Default for JobsConfig {
    fn default() -> Self {
        Self {
            kickoff_link_email_reminder_delay: default_kickoff_link_email_reminder_delay(),
        }
    }
}

fn default_kickoff_link_email_reminder_delay() -> Duration {
    Duration::from_secs(60 * 60 * 6) // Every 6 hours
}
