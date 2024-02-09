use crate::{messages::*, primitives::*};

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

pub trait NotificationEvent: std::fmt::Debug {
    fn user_id(&self) -> &GaloyUserId;
    fn deep_link(&self) -> DeepLink;
    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage;
}

impl NotificationEvent for CircleGrew {
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

impl NotificationEvent for CircleThresholdReached {
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

#[derive(Debug)]
pub struct DocumentsSubmitted {
    pub user_id: GaloyUserId,
}

impl NotificationEvent for DocumentsSubmitted {
    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        Messages::documents_submitted(locale.as_ref(), self)
    }
}

#[derive(Debug)]
pub struct DocumentsApproved {
    pub user_id: GaloyUserId,
}

impl NotificationEvent for DocumentsApproved {
    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        Messages::documents_approved(locale.as_ref(), self)
    }
}

#[derive(Debug)]
pub struct DocumentsRejected {
    pub user_id: GaloyUserId,
}

impl NotificationEvent for DocumentsRejected {
    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        Messages::documents_rejected(locale.as_ref(), self)
    }
}

#[derive(Debug)]
pub struct DocumentsReviewPending {
    pub user_id: GaloyUserId,
}

impl NotificationEvent for DocumentsReviewPending {
    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        Messages::documents_review_pending(locale.as_ref(), self)
    }
}
