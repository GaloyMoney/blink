use novu::events::AllowedPayloadValues;

use std::collections::HashMap;

use crate::primitives::*;

pub trait NotificationEvent {
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
    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn into_payload(self) -> HashMap<String, AllowedPayloadValues> {
        [
            (
                format!("circle_type"),
                AllowedPayloadValues::STRING(self.circle_type.to_string()),
            ),
            (
                format!("this_month_circle_size"),
                AllowedPayloadValues::NUMBER(self.this_month_circle_size as i32),
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
    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn into_payload(self) -> HashMap<String, AllowedPayloadValues> {
        [(
            format!("threshold"),
            AllowedPayloadValues::NUMBER(self.threshold as i32),
        )]
        .into_iter()
        .collect()
    }
}
