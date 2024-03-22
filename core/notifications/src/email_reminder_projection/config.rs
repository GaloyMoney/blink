use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct EmailReminderProjectionConfig {
    #[serde(default = "default_account_liveness_threshold_days")]
    pub account_liveness_threshold_days: u16,
    #[serde(default = "default_account_aged_threshold_days")]
    pub account_aged_threshold_days: u16,
    #[serde(default = "default_notification_cool_off_threshold_days")]
    pub notification_cool_off_threshold_days: u16,
}

impl Default for EmailReminderProjectionConfig {
    fn default() -> Self {
        Self {
            account_liveness_threshold_days: default_account_liveness_threshold_days(),
            account_aged_threshold_days: default_account_aged_threshold_days(),
            notification_cool_off_threshold_days: default_notification_cool_off_threshold_days(),
        }
    }
}

fn default_account_liveness_threshold_days() -> u16 {
    21
}

fn default_account_aged_threshold_days() -> u16 {
    21
}

fn default_notification_cool_off_threshold_days() -> u16 {
    90
}
