use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde_with::serde_as]
pub struct JobsConfig {
    #[serde(default = "default_kickoff_link_email_reminder_delay")]
    pub kickoff_link_email_reminder_delay: i32,
}

impl Default for JobsConfig {
    fn default() -> Self {
        Self {
            kickoff_link_email_reminder_delay: default_kickoff_link_email_reminder_delay(),
        }
    }
}

impl JobsConfig {
    pub fn kickoff_link_email_reminder_delay(&self) -> Duration {
        Duration::from_secs(self.kickoff_link_email_reminder_delay as u64)
    }
}

fn default_kickoff_link_email_reminder_delay() -> i32 {
    60 * 60 * 6 // Every 6 hours
}
