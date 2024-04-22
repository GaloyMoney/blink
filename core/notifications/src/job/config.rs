use serde::{Deserialize, Serialize};
use std::time::Duration;

#[serde_with::serde_as]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobsConfig {
    #[serde_as(as = "serde_with::DurationSeconds<u64>")]
    #[serde(default = "default_kickoff_link_email_reminder_delay")]
    pub kickoff_link_email_reminder_delay: Duration,
    #[serde(default = "default_max_concurrent_jobs")]
    pub max_concurrent_jobs: usize,
    #[serde(default = "default_min_concurrent_job")]
    pub min_concurrent_jobs: usize,
}

impl Default for JobsConfig {
    fn default() -> Self {
        Self {
            kickoff_link_email_reminder_delay: default_kickoff_link_email_reminder_delay(),
            max_concurrent_jobs: default_max_concurrent_jobs(),
            min_concurrent_jobs: default_min_concurrent_job(),
        }
    }
}

fn default_kickoff_link_email_reminder_delay() -> Duration {
    Duration::from_secs(60 * 60 * 6) // Every 6 hours
}

fn default_min_concurrent_job() -> usize {
    12
}

fn default_max_concurrent_jobs() -> usize {
    24
}
