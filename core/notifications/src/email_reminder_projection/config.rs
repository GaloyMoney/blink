use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct EmailReminderProjectionConfig {
    #[serde(default = "default_account_liveness_threshold_minutes")]
    pub account_liveness_threshold_minutes: i32,
    #[serde(default = "default_account_age_threshold_minutes")]
    pub account_age_threshold_minutes: i32,
    #[serde(default = "default_notification_cool_off_threshold_minutes")]
    pub notification_cool_off_threshold_minutes: i32,
}

impl Default for EmailReminderProjectionConfig {
    fn default() -> Self {
        Self {
            account_liveness_threshold_minutes: default_account_liveness_threshold_minutes(),
            account_age_threshold_minutes: default_account_age_threshold_minutes(),
            notification_cool_off_threshold_minutes:
                default_notification_cool_off_threshold_minutes(),
        }
    }
}

fn default_account_liveness_threshold_minutes() -> i32 {
    21 * 24 * 60 // 21 days
}

fn default_account_age_threshold_minutes() -> i32 {
    21 * 24 * 60 // 21 days
}

fn default_notification_cool_off_threshold_minutes() -> i32 {
    90 * 24 * 60 // 90 days
}
