use std::collections::HashMap;

use crate::{executor::AllowedPayloadValues, primitives::*};

pub trait NotificationEvent {
    fn workflow_name() -> &'static str;
    fn user_id(&self) -> &GaloyUserId;
    fn into_payload(self) -> HashMap<String, AllowedPayloadValues>;
}

#[derive(Debug)]
pub struct CircleGrew {
    pub user_id: GaloyUserId,
    pub circle_type: CircleType,
    pub this_month_circle_size: u32,
    pub all_time_circle_size: u32,
}

impl NotificationEvent for CircleGrew {
    fn workflow_name() -> &'static str {
        "circle_grew"
    }

    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn into_payload(self) -> HashMap<String, AllowedPayloadValues> {
        [
            (
                "circle_type".to_string(),
                AllowedPayloadValues::String(self.circle_type.to_string()),
            ),
            (
                "this_month_circle_size".to_string(),
                AllowedPayloadValues::Number(self.this_month_circle_size as i32),
            ),
        ]
        .into_iter()
        .collect()
    }
}

#[derive(Debug)]
pub struct ThresholdReached {
    pub user_id: GaloyUserId,
    pub threshold: u32,
}

impl NotificationEvent for ThresholdReached {
    fn workflow_name() -> &'static str {
        "threshold_reached"
    }

    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn into_payload(self) -> HashMap<String, AllowedPayloadValues> {
        [(
            "threshold".to_string(),
            AllowedPayloadValues::Number(self.threshold as i32),
        )]
        .into_iter()
        .collect()
    }
}
