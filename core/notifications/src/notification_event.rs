use crate::{messages::*, primitives::*};

#[derive(Debug)]
pub enum DeepLink {
    None,
    Circles,
}

#[derive(Debug)]
pub struct CircleGrew {
    pub user_id: GaloyUserId,
    pub circle_type: CircleType,
    pub this_month_circle_size: u32,
    pub all_time_circle_size: u32,
}

pub trait NotificationEventNew {
    fn user_id(&self) -> &GaloyUserId;
    fn deep_link(&self) -> DeepLink;
    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage;
}

impl NotificationEventNew for CircleGrew {
    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::Circles
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        Messages::circle_grew(locale.as_ref(), self)
    }
}

#[derive(Debug)]
pub struct CircleThresholdReached {
    pub user_id: GaloyUserId,
    pub circle_type: CircleType,
    pub time_frame: CircleTimeFrame,
    pub threshold: u32,
}

impl NotificationEventNew for CircleThresholdReached {
    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::Circles
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        Messages::circle_threshold_reached(locale.as_ref(), self)
    }
}
