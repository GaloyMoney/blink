use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::{DeepLink, NotificationEvent, SingleUserEvent};
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IdentityVerificationApproved {
    pub user_id: GaloyUserId,
}

impl SingleUserEvent for IdentityVerificationApproved {
    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }
}

impl NotificationEvent for IdentityVerificationApproved {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::AdminNotification
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        let title = t!(
            "identity_verification_approved.title",
            locale = locale.as_ref()
        )
        .to_string();
        let body = t!(
            "identity_verification_approved.body",
            locale = locale.as_ref()
        )
        .to_string();
        LocalizedPushMessage { title, body }
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        let email_formatter = EmailFormatter::new();

        let title = t!(
            "identity_verification_approved.title",
            locale = locale.as_ref()
        )
        .to_string();
        let body = t!(
            "identity_verification_approved.body",
            locale = locale.as_ref()
        )
        .to_string();

        let body = email_formatter.generic_email_template(&title, &body);

        Some(LocalizedEmail {
            subject: title,
            body,
        })
    }

    fn should_send_email(&self) -> bool {
        true
    }
}
