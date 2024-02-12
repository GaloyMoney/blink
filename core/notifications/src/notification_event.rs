use serde::{Deserialize, Serialize};

use crate::{messages::*, primitives::*};

pub enum DeepLink {
    None,
    Circles,
}

pub trait NotificationEvent: std::fmt::Debug + Into<NotificationEventPayload> {
    fn user_id(&self) -> &GaloyUserId;
    fn deep_link(&self) -> DeepLink;
    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage;
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum NotificationEventPayload {
    CircleGrew(CircleGrew),
    CircleThresholdReached(CircleThresholdReached),
    DocumentsSubmitted(DocumentsSubmitted),
    DocumentsApproved(DocumentsApproved),
    DocumentsRejected(DocumentsRejected),
    DocumentsReviewPending(DocumentsReviewPending),
}

impl NotificationEvent for NotificationEventPayload {
    fn user_id(&self) -> &GaloyUserId {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.user_id(),
            NotificationEventPayload::CircleThresholdReached(event) => event.user_id(),
            NotificationEventPayload::DocumentsSubmitted(event) => event.user_id(),
            NotificationEventPayload::DocumentsApproved(event) => event.user_id(),
            NotificationEventPayload::DocumentsRejected(event) => event.user_id(),
            NotificationEventPayload::DocumentsReviewPending(event) => event.user_id(),
        }
    }

    fn deep_link(&self) -> DeepLink {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.deep_link(),
            NotificationEventPayload::CircleThresholdReached(event) => event.deep_link(),
            NotificationEventPayload::DocumentsSubmitted(event) => event.deep_link(),
            NotificationEventPayload::DocumentsApproved(event) => event.deep_link(),
            NotificationEventPayload::DocumentsRejected(event) => event.deep_link(),
            NotificationEventPayload::DocumentsReviewPending(event) => event.deep_link(),
        }
    }

    fn to_localized_msg(&self, locale: GaloyLocale) -> LocalizedMessage {
        match self {
            NotificationEventPayload::CircleGrew(event) => event.to_localized_msg(locale),
            NotificationEventPayload::CircleThresholdReached(event) => {
                event.to_localized_msg(locale)
            }
            NotificationEventPayload::DocumentsSubmitted(event) => event.to_localized_msg(locale),
            NotificationEventPayload::DocumentsApproved(event) => event.to_localized_msg(locale),
            NotificationEventPayload::DocumentsRejected(event) => event.to_localized_msg(locale),
            NotificationEventPayload::DocumentsReviewPending(event) => {
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

impl From<DocumentsSubmitted> for NotificationEventPayload {
    fn from(event: DocumentsSubmitted) -> Self {
        NotificationEventPayload::DocumentsSubmitted(event)
    }
}

#[derive(Debug, Serialize, Deserialize)]
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

impl From<DocumentsApproved> for NotificationEventPayload {
    fn from(event: DocumentsApproved) -> Self {
        NotificationEventPayload::DocumentsApproved(event)
    }
}

#[derive(Debug, Serialize, Deserialize)]
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

impl From<DocumentsRejected> for NotificationEventPayload {
    fn from(event: DocumentsRejected) -> Self {
        NotificationEventPayload::DocumentsRejected(event)
    }
}

#[derive(Debug, Serialize, Deserialize)]
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

impl From<DocumentsReviewPending> for NotificationEventPayload {
    fn from(event: DocumentsReviewPending) -> Self {
        NotificationEventPayload::DocumentsReviewPending(event)
    }
}
