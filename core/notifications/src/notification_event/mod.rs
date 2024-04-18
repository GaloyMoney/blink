mod circle_grew;
mod circle_threshold_reached;
mod identity_verification_approved;
mod identity_verification_declined;
mod identity_verification_review_started;
mod link_email_reminder;
mod marketing_notification_triggered;
mod price_changed;
mod transaction_occurred;

use serde::{Deserialize, Serialize};

use crate::{messages::*, primitives::*};

pub(super) use circle_grew::*;
pub(super) use circle_threshold_reached::*;
pub(super) use identity_verification_approved::*;
pub(super) use identity_verification_declined::*;
pub(super) use identity_verification_review_started::*;
pub(super) use link_email_reminder::*;
pub(super) use marketing_notification_triggered::*;
pub(super) use price_changed::*;
pub(super) use transaction_occurred::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DeepLink {
    Circles,
    Price,
    Earn,
    Map,
    People,
}

impl DeepLink {
    pub fn to_link_string(&self) -> String {
        match self {
            DeepLink::Circles => "/people/circles".to_string(),
            DeepLink::Price => "/price".to_string(),
            DeepLink::Earn => "/earn".to_string(),
            DeepLink::Map => "/map".to_string(),
            DeepLink::People => "/people".to_string(),
        }
    }
}

pub trait NotificationEvent: std::fmt::Debug + Send + Sync {
    fn category(&self) -> UserNotificationCategory;
    fn deep_link(&self) -> Option<DeepLink>;
    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage;
    fn should_send_email(&self) -> bool;
    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail>;
    fn should_be_added_to_history(&self) -> bool {
        false
    }
    fn to_localized_persistent_message(&self, _locale: GaloyLocale) -> LocalizedStatefulMessage {
        unimplemented!()
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NotificationEventPayload {
    CircleGrew(CircleGrew),
    CircleThresholdReached(CircleThresholdReached),
    IdentityVerificationApproved(IdentityVerificationApproved),
    IdentityVerificationDeclined(IdentityVerificationDeclined),
    IdentityVerificationReviewStarted(IdentityVerificationReviewStarted),
    TransactionOccurred(TransactionOccurred),
    PriceChanged(PriceChanged),
    MarketingNotificationTriggered(MarketingNotificationTriggered),
    LinkEmailReminder(LinkEmailReminder),
}

impl AsRef<dyn NotificationEvent> for NotificationEventPayload {
    fn as_ref(&self) -> &(dyn NotificationEvent + 'static) {
        match self {
            NotificationEventPayload::CircleGrew(event) => event,
            NotificationEventPayload::CircleThresholdReached(event) => event,
            NotificationEventPayload::IdentityVerificationApproved(event) => event,
            NotificationEventPayload::IdentityVerificationDeclined(event) => event,
            NotificationEventPayload::IdentityVerificationReviewStarted(event) => event,
            NotificationEventPayload::TransactionOccurred(event) => event,
            NotificationEventPayload::PriceChanged(event) => event,
            NotificationEventPayload::MarketingNotificationTriggered(event) => event,
            NotificationEventPayload::LinkEmailReminder(event) => event,
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

impl From<TransactionOccurred> for NotificationEventPayload {
    fn from(event: TransactionOccurred) -> Self {
        NotificationEventPayload::TransactionOccurred(event)
    }
}

impl From<PriceChanged> for NotificationEventPayload {
    fn from(event: PriceChanged) -> Self {
        NotificationEventPayload::PriceChanged(event)
    }
}

impl From<MarketingNotificationTriggered> for NotificationEventPayload {
    fn from(event: MarketingNotificationTriggered) -> Self {
        NotificationEventPayload::MarketingNotificationTriggered(event)
    }
}

impl From<LinkEmailReminder> for NotificationEventPayload {
    fn from(event: LinkEmailReminder) -> Self {
        NotificationEventPayload::LinkEmailReminder(event)
    }
}
