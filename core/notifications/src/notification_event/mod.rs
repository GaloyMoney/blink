mod circle_grew;
mod circle_threshold_reached;
mod identity_verification_approved;
mod identity_verification_declined;
mod identity_verification_review_started;
mod transaction_info;

use serde::{Deserialize, Serialize};

use crate::{messages::*, primitives::*};

pub(super) use circle_grew::*;
pub(super) use circle_threshold_reached::*;
pub(super) use identity_verification_approved::*;
pub(super) use identity_verification_declined::*;
pub(super) use identity_verification_review_started::*;
pub(super) use transaction_info::*;

pub enum DeepLink {
    None,
    Circles,
}

pub trait SingleUserEvent:
    NotificationEvent + std::fmt::Debug + Into<SingleUserEventPayload> + Clone
{
    fn user_id(&self) -> &GaloyUserId;
}

pub trait NotificationEvent {
    fn category(&self) -> UserNotificationCategory;
    fn deep_link(&self) -> DeepLink;
    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage;
    fn should_send_email(&self) -> bool;
    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail>;
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SingleUserEventPayload {
    CircleGrew(CircleGrew),
    CircleThresholdReached(CircleThresholdReached),
    IdentityVerificationApproved(IdentityVerificationApproved),
    IdentityVerificationDeclined(IdentityVerificationDeclined),
    IdentityVerificationReviewStarted(IdentityVerificationReviewStarted),
    TransactionInfo(TransactionInfo),
}

impl SingleUserEvent for SingleUserEventPayload {
    fn user_id(&self) -> &GaloyUserId {
        match self {
            SingleUserEventPayload::CircleGrew(event) => event.user_id(),
            SingleUserEventPayload::CircleThresholdReached(event) => event.user_id(),
            SingleUserEventPayload::IdentityVerificationApproved(event) => event.user_id(),
            SingleUserEventPayload::IdentityVerificationDeclined(event) => event.user_id(),
            SingleUserEventPayload::IdentityVerificationReviewStarted(event) => event.user_id(),
            SingleUserEventPayload::TransactionInfo(event) => event.user_id(),
        }
    }
}

impl NotificationEvent for SingleUserEventPayload {
    fn category(&self) -> UserNotificationCategory {
        match self {
            SingleUserEventPayload::CircleGrew(e) => e.category(),
            SingleUserEventPayload::CircleThresholdReached(e) => e.category(),
            SingleUserEventPayload::IdentityVerificationApproved(e) => e.category(),
            SingleUserEventPayload::IdentityVerificationDeclined(e) => e.category(),
            SingleUserEventPayload::IdentityVerificationReviewStarted(e) => e.category(),
            SingleUserEventPayload::TransactionInfo(e) => e.category(),
        }
    }

    fn deep_link(&self) -> DeepLink {
        match self {
            SingleUserEventPayload::CircleGrew(event) => event.deep_link(),
            SingleUserEventPayload::CircleThresholdReached(event) => event.deep_link(),
            SingleUserEventPayload::IdentityVerificationApproved(event) => event.deep_link(),
            SingleUserEventPayload::IdentityVerificationDeclined(event) => event.deep_link(),
            SingleUserEventPayload::IdentityVerificationReviewStarted(event) => event.deep_link(),
            SingleUserEventPayload::TransactionInfo(event) => event.deep_link(),
        }
    }

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        match self {
            SingleUserEventPayload::CircleGrew(event) => event.to_localized_push_msg(locale),
            SingleUserEventPayload::CircleThresholdReached(event) => {
                event.to_localized_push_msg(locale)
            }
            SingleUserEventPayload::IdentityVerificationApproved(event) => {
                event.to_localized_push_msg(locale)
            }
            SingleUserEventPayload::IdentityVerificationDeclined(event) => {
                event.to_localized_push_msg(locale)
            }
            SingleUserEventPayload::IdentityVerificationReviewStarted(event) => {
                event.to_localized_push_msg(locale)
            }
            SingleUserEventPayload::TransactionInfo(event) => event.to_localized_push_msg(locale),
        }
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        match self {
            SingleUserEventPayload::CircleGrew(event) => event.to_localized_email(locale),
            SingleUserEventPayload::CircleThresholdReached(event) => {
                event.to_localized_email(locale)
            }
            SingleUserEventPayload::IdentityVerificationApproved(event) => {
                event.to_localized_email(locale)
            }
            SingleUserEventPayload::IdentityVerificationDeclined(event) => {
                event.to_localized_email(locale)
            }
            SingleUserEventPayload::IdentityVerificationReviewStarted(event) => {
                event.to_localized_email(locale)
            }
            SingleUserEventPayload::TransactionInfo(event) => event.to_localized_email(locale),
        }
    }

    fn should_send_email(&self) -> bool {
        match self {
            SingleUserEventPayload::CircleGrew(event) => event.should_send_email(),
            SingleUserEventPayload::CircleThresholdReached(event) => event.should_send_email(),
            SingleUserEventPayload::IdentityVerificationApproved(event) => {
                event.should_send_email()
            }
            SingleUserEventPayload::IdentityVerificationDeclined(event) => {
                event.should_send_email()
            }
            SingleUserEventPayload::IdentityVerificationReviewStarted(event) => {
                event.should_send_email()
            }
            SingleUserEventPayload::TransactionInfo(event) => event.should_send_email(),
        }
    }
}

impl From<CircleGrew> for SingleUserEventPayload {
    fn from(event: CircleGrew) -> Self {
        SingleUserEventPayload::CircleGrew(event)
    }
}

impl From<CircleThresholdReached> for SingleUserEventPayload {
    fn from(event: CircleThresholdReached) -> Self {
        SingleUserEventPayload::CircleThresholdReached(event)
    }
}

impl From<IdentityVerificationApproved> for SingleUserEventPayload {
    fn from(event: IdentityVerificationApproved) -> Self {
        SingleUserEventPayload::IdentityVerificationApproved(event)
    }
}

impl From<IdentityVerificationDeclined> for SingleUserEventPayload {
    fn from(event: IdentityVerificationDeclined) -> Self {
        SingleUserEventPayload::IdentityVerificationDeclined(event)
    }
}

impl From<IdentityVerificationReviewStarted> for SingleUserEventPayload {
    fn from(event: IdentityVerificationReviewStarted) -> Self {
        SingleUserEventPayload::IdentityVerificationReviewStarted(event)
    }
}

impl From<TransactionInfo> for SingleUserEventPayload {
    fn from(event: TransactionInfo) -> Self {
        SingleUserEventPayload::TransactionInfo(event)
    }
}
