use serde::{Deserialize, Serialize};

use crate::{messages::*, primitives::*};

pub enum DeepLink {
    None,
    Circles,
}

pub trait NotificationEvent: std::fmt::Debug + Into<NotificationEventPayload> + Clone {
    fn category(&self) -> UserNotificationCategory;
    fn user_id(&self) -> &GaloyUserId;
    fn deep_link(&self) -> DeepLink;
    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage;
    fn should_send_email(&self) -> bool;
    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail>;
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.to_localized_push_msg(locale),
            NotificationEventPayload::CircleThresholdReached(event) => {
                event.to_localized_push_msg(locale)
            }
            NotificationEventPayload::IdentityVerificationApproved(event) => {
                event.to_localized_push_msg(locale)
            }
            NotificationEventPayload::IdentityVerificationDeclined(event) => {
                event.to_localized_push_msg(locale)
            }
            NotificationEventPayload::IdentityVerificationReviewPending(event) => {
                event.to_localized_push_msg(locale)
            }
        }
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.to_localized_email(locale),
            NotificationEventPayload::CircleThresholdReached(event) => {
                event.to_localized_email(locale)
            }
            NotificationEventPayload::IdentityVerificationApproved(event) => {
                event.to_localized_email(locale)
            }
            NotificationEventPayload::IdentityVerificationDeclined(event) => {
                event.to_localized_email(locale)
            }
            NotificationEventPayload::IdentityVerificationReviewPending(event) => {
                event.to_localized_email(locale)
            }
        }
    }

    fn should_send_email(&self) -> bool {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.should_send_email(),
            NotificationEventPayload::CircleThresholdReached(event) => event.should_send_email(),
            NotificationEventPayload::IdentityVerificationApproved(event) => {
                event.should_send_email()
            }
            NotificationEventPayload::IdentityVerificationDeclined(event) => {
                event.should_send_email()
            }
            NotificationEventPayload::IdentityVerificationReviewPending(event) => {
                event.should_send_email()
            }
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        PushMessages::circle_grew(locale.as_ref(), self)
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        EmailMessages::circle_grew(locale.as_ref(), self)
    }

    fn should_send_email(&self) -> bool {
        false
    }
}

impl From<CircleGrew> for NotificationEventPayload {
    fn from(event: CircleGrew) -> Self {
        NotificationEventPayload::CircleGrew(event)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        PushMessages::circle_threshold_reached(locale.as_ref(), self)
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        EmailMessages::circle_threshold_reached(locale.as_ref(), self)
    }

    fn should_send_email(&self) -> bool {
        false
    }
}

impl From<CircleThresholdReached> for NotificationEventPayload {
    fn from(event: CircleThresholdReached) -> Self {
        NotificationEventPayload::CircleThresholdReached(event)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        PushMessages::identity_verification_approved(locale.as_ref(), self)
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        EmailMessages::identity_verification_approved(locale.as_ref(), self)
    }

    fn should_send_email(&self) -> bool {
        false
    }
}

impl From<IdentityVerificationApproved> for NotificationEventPayload {
    fn from(event: IdentityVerificationApproved) -> Self {
        NotificationEventPayload::IdentityVerificationApproved(event)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum IdentityVerificationDeclinedReason {
    DocumentsNotClear,
    SelfieNotClear,
    DocumentsNotSupported,
    DocumentsExpired,
    DocumentsDoNotMatch,
    Other,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        PushMessages::identity_verification_declined(locale.as_ref(), self)
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        EmailMessages::identity_verification_declined(locale.as_ref(), self)
    }

    fn should_send_email(&self) -> bool {
        false
    }
}

impl From<IdentityVerificationDeclined> for NotificationEventPayload {
    fn from(event: IdentityVerificationDeclined) -> Self {
        NotificationEventPayload::IdentityVerificationDeclined(event)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        PushMessages::identity_verification_review_pending(locale.as_ref(), self)
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        EmailMessages::identity_verification_review_pending(locale.as_ref(), self)
    }

    fn should_send_email(&self) -> bool {
        false
    }
}

impl From<IdentityVerificationReviewPending> for NotificationEventPayload {
    fn from(event: IdentityVerificationReviewPending) -> Self {
        NotificationEventPayload::IdentityVerificationReviewPending(event)
    }
}
