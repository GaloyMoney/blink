use serde::{Deserialize, Serialize};

use super::{DeepLink, NotificationEvent, NotificationEventError};
use crate::{messages::*, primitives::*};

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

    fn to_localized_email(
        &self,
        locale: GaloyLocale,
    ) -> Result<Option<LocalizedEmail>, NotificationEventError> {
        Ok(EmailMessages::identity_verification_approved(
            locale.as_ref(),
            self,
        )?)
    }

    fn should_send_email(&self) -> bool {
        true
    }
}
