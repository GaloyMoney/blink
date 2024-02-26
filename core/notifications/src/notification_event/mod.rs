mod circle_grew;
mod circle_threshold_reached;
pub mod error;
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

use error::*;

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
    fn to_localized_email(
        &self,
        locale: GaloyLocale,
    ) -> Result<Option<LocalizedEmail>, NotificationEventError>;
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
}

impl NotificationEvent for NotificationEventPayload {
    fn category(&self) -> UserNotificationCategory {
        match self {
            NotificationEventPayload::CircleGrew(e) => e.category(),
            NotificationEventPayload::CircleThresholdReached(e) => e.category(),
            NotificationEventPayload::IdentityVerificationApproved(e) => e.category(),
            NotificationEventPayload::IdentityVerificationDeclined(e) => e.category(),
            NotificationEventPayload::IdentityVerificationReviewStarted(e) => e.category(),
            NotificationEventPayload::TransactionInfo(e) => e.category(),
        }
    }

    fn user_id(&self) -> &GaloyUserId {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.user_id(),
            NotificationEventPayload::CircleThresholdReached(event) => event.user_id(),
            NotificationEventPayload::IdentityVerificationApproved(event) => event.user_id(),
            NotificationEventPayload::IdentityVerificationDeclined(event) => event.user_id(),
            NotificationEventPayload::IdentityVerificationReviewStarted(event) => event.user_id(),
            NotificationEventPayload::TransactionInfo(event) => event.user_id(),
        }
    }

    fn deep_link(&self) -> DeepLink {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.deep_link(),
            NotificationEventPayload::CircleThresholdReached(event) => event.deep_link(),
            NotificationEventPayload::IdentityVerificationApproved(event) => event.deep_link(),
            NotificationEventPayload::IdentityVerificationDeclined(event) => event.deep_link(),
            NotificationEventPayload::IdentityVerificationReviewStarted(event) => event.deep_link(),
            NotificationEventPayload::TransactionInfo(event) => event.deep_link(),
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
            NotificationEventPayload::IdentityVerificationReviewStarted(event) => {
                event.to_localized_push_msg(locale)
            }
            NotificationEventPayload::TransactionInfo(event) => event.to_localized_push_msg(locale),
        }
    }

    fn to_localized_email(
        &self,
        locale: GaloyLocale,
    ) -> Result<Option<LocalizedEmail>, NotificationEventError> {
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
            NotificationEventPayload::IdentityVerificationReviewStarted(event) => {
                event.to_localized_email(locale)
            }
            NotificationEventPayload::TransactionInfo(event) => event.to_localized_email(locale),
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
            NotificationEventPayload::IdentityVerificationReviewStarted(event) => {
                event.should_send_email()
            }
            NotificationEventPayload::TransactionInfo(event) => event.should_send_email(),
        }
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
