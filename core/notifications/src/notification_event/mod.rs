mod circle_grew;
mod circle_threshold_reached;
mod identity_verification_approved;
mod identity_verification_declined;
mod identity_verification_review_started;
mod marketing_notification_requested;
mod price_changed;
mod transaction_info;

use serde::{Deserialize, Serialize};

use crate::{messages::*, primitives::*};

pub(super) use circle_grew::*;
pub(super) use circle_threshold_reached::*;
pub(super) use identity_verification_approved::*;
pub(super) use identity_verification_declined::*;
pub(super) use identity_verification_review_started::*;
pub(super) use marketing_notification_requested::*;
pub(super) use price_changed::*;
pub(super) use transaction_info::*;

pub enum DeepLink {
    None,
    Circles,
}

pub trait NotificationEvent: std::fmt::Debug + Send + Sync {
    fn category(&self) -> UserNotificationCategory;
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
    IdentityVerificationReviewStarted(IdentityVerificationReviewStarted),
    TransactionInfo(TransactionInfo),
    PriceChanged(PriceChanged),
    MarketingNotificationRequested(MarketingNotificationRequested),
}

impl AsRef<dyn NotificationEvent> for NotificationEventPayload {
    fn as_ref(&self) -> &(dyn NotificationEvent + 'static) {
        match self {
            NotificationEventPayload::CircleGrew(event) => event,
            NotificationEventPayload::CircleThresholdReached(event) => event,
            NotificationEventPayload::IdentityVerificationApproved(event) => event,
            NotificationEventPayload::IdentityVerificationDeclined(event) => event,
            NotificationEventPayload::IdentityVerificationReviewStarted(event) => event,
            NotificationEventPayload::TransactionInfo(event) => event,
            NotificationEventPayload::PriceChanged(event) => event,
            NotificationEventPayload::MarketingNotificationRequested(event) => event,
        }
    }
}

impl std::ops::Deref for NotificationEventPayload {
    type Target = dyn NotificationEvent;

    fn deref(&self) -> &Self::Target {
        self.as_ref()
    }
}

impl From<CircleGrew> for NotificationEventPayload {
    fn from(event: CircleGrew) -> Self {
        NotificationEventPayload::CircleGrew(event)
    }
}

impl From<CircleThresholdReached> for NotificationEventPayload {
    fn from(event: CircleThresholdReached) -> Self {
        NotificationEventPayload::CircleThresholdReached(event)
    }
}

impl From<IdentityVerificationApproved> for NotificationEventPayload {
    fn from(event: IdentityVerificationApproved) -> Self {
        NotificationEventPayload::IdentityVerificationApproved(event)
    }
}

impl From<IdentityVerificationDeclined> for NotificationEventPayload {
    fn from(event: IdentityVerificationDeclined) -> Self {
        NotificationEventPayload::IdentityVerificationDeclined(event)
    }
}

impl From<IdentityVerificationReviewStarted> for NotificationEventPayload {
    fn from(event: IdentityVerificationReviewStarted) -> Self {
        NotificationEventPayload::IdentityVerificationReviewStarted(event)
    }
}

impl From<TransactionInfo> for NotificationEventPayload {
    fn from(event: TransactionInfo) -> Self {
        NotificationEventPayload::TransactionInfo(event)
    }
}

impl From<PriceChanged> for NotificationEventPayload {
    fn from(event: PriceChanged) -> Self {
        NotificationEventPayload::PriceChanged(event)
    }
}

impl From<MarketingNotificationRequested> for NotificationEventPayload {
    fn from(event: MarketingNotificationRequested) -> Self {
        NotificationEventPayload::MarketingNotificationRequested(event)
    }
}
