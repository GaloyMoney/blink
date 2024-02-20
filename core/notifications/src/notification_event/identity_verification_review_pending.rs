use super::{DeepLink, NotificationEvent};
use crate::{messages::*, primitives::*};
use serde::{Deserialize, Serialize};

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
