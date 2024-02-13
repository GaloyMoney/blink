use serde::{Deserialize, Serialize};

use crate::{messages::*, primitives::*};

pub enum DeepLink {
    None,
    Circles,
}

pub trait NotificationEvent: std::fmt::Debug + Into<NotificationEventPayload> {
    fn category(&self) -> UserNotificationCategory;
    fn user_id(&self) -> &GaloyUserId;
    fn deep_link(&self) -> DeepLink;
    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage;
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NotificationEventPayload {
    CircleGrew(CircleGrew),
    CircleThresholdReached(CircleThresholdReached),
    IdentityVerificationApproved(IdentityVerificationApproved),
    IdentityVerificationDeclined(IdentityVerificationDeclined),
    IdentityVerificationReviewPending(IdentityVerificationReviewPending),
}

impl NotificationEvent for NotificationEventPayload {
    fn category(&self) -> UserNotificationCategory {
        match self {
            NotificationEventPayload::CircleGrew(e) => e.category(),
            NotificationEventPayload::CircleThresholdReached(e) => e.category(),
            NotificationEventPayload::IdentityVerificationApproved(e) => e.category(),
            NotificationEventPayload::IdentityVerificationDeclined(e) => e.category(),
            NotificationEventPayload::IdentityVerificationReviewPending(e) => e.category(),
        }
    }

    fn user_id(&self) -> &GaloyUserId {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.user_id(),
            NotificationEventPayload::CircleThresholdReached(event) => event.user_id(),
            NotificationEventPayload::IdentityVerificationApproved(event) => event.user_id(),
            NotificationEventPayload::IdentityVerificationDeclined(event) => event.user_id(),
            NotificationEventPayload::IdentityVerificationReviewPending(event) => event.user_id(),
        }
    }

    fn deep_link(&self) -> DeepLink {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.deep_link(),
            NotificationEventPayload::CircleThresholdReached(event) => event.deep_link(),
            NotificationEventPayload::IdentityVerificationApproved(event) => event.deep_link(),
            NotificationEventPayload::IdentityVerificationDeclined(event) => event.deep_link(),
            NotificationEventPayload::IdentityVerificationReviewPending(event) => event.deep_link(),
        }
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.to_localized_msg(locale),
            NotificationEventPayload::CircleThresholdReached(event) => {
                event.to_localized_msg(locale)
            }
            NotificationEventPayload::IdentityVerificationApproved(event) => {
                event.to_localized_msg(locale)
            }
            NotificationEventPayload::IdentityVerificationDeclined(event) => {
                event.to_localized_msg(locale)
            }
            NotificationEventPayload::IdentityVerificationReviewPending(event) => {
                event.to_localized_msg(locale)
            }
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CircleGrew {
    pub user_id: GaloyUserId,
    pub circle_type: CircleType,
    pub this_month_circle_size: u32,
    pub all_time_circle_size: u32,
}

impl NotificationEvent for CircleGrew {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Circles
    }

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

impl From<CircleGrew> for NotificationEventPayload {
    fn from(event: CircleGrew) -> Self {
        NotificationEventPayload::CircleGrew(event)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CircleThresholdReached {
    pub user_id: GaloyUserId,
    pub circle_type: CircleType,
    pub time_frame: CircleTimeFrame,
    pub threshold: u32,
}

impl NotificationEvent for CircleThresholdReached {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Circles
    }

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

impl From<CircleThresholdReached> for NotificationEventPayload {
    fn from(event: CircleThresholdReached) -> Self {
        NotificationEventPayload::CircleThresholdReached(event)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IdentityVerificationApproved {
    pub user_id: GaloyUserId,
}

impl NotificationEvent for IdentityVerificationApproved {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::AdminNotification
    }

    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        Messages::identity_verification_approved(locale.as_ref(), self)
    }
}

impl From<IdentityVerificationApproved> for NotificationEventPayload {
    fn from(event: IdentityVerificationApproved) -> Self {
        NotificationEventPayload::IdentityVerificationApproved(event)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub enum IdentityVerificationDeclinedReason {
    DocumentsNotClear,
    VerificationPhotoNotClear,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IdentityVerificationDeclined {
    pub user_id: GaloyUserId,
    pub declined_reason: IdentityVerificationDeclinedReason,
}

impl NotificationEvent for IdentityVerificationDeclined {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::AdminNotification
    }

    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        Messages::identity_verification_declined(locale.as_ref(), self)
    }
}

impl From<IdentityVerificationDeclined> for NotificationEventPayload {
    fn from(event: IdentityVerificationDeclined) -> Self {
        NotificationEventPayload::IdentityVerificationDeclined(event)
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IdentityVerificationReviewPending {
    pub user_id: GaloyUserId,
}

impl NotificationEvent for IdentityVerificationReviewPending {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::AdminNotification
    }

    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        Messages::identity_verification_review_pending(locale.as_ref(), self)
    }
}

impl From<IdentityVerificationReviewPending> for NotificationEventPayload {
    fn from(event: IdentityVerificationReviewPending) -> Self {
        NotificationEventPayload::IdentityVerificationReviewPending(event)
    }
}
