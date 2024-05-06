use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::NotificationEvent;
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IdentityVerificationApproved {}

impl NotificationEvent for IdentityVerificationApproved {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::AdminNotification
    }

    fn should_send_push(&self) -> bool {
        true
    }

    fn to_localized_push_msg(&self, locale: &GaloyLocale) -> LocalizedPushMessage {
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

    fn should_send_email(&self) -> bool {
        true
    }

    fn to_localized_email(&self, locale: &GaloyLocale) -> LocalizedEmail {
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

        LocalizedEmail {
            subject: title,
            body,
        }
    }

    fn should_be_added_to_history(&self) -> bool {
        true
    }

    fn to_localized_persistent_message(&self, locale: GaloyLocale) -> LocalizedStatefulMessage {
        let push_msg = self.to_localized_push_msg(&locale);

        LocalizedStatefulMessage {
            locale,
            title: push_msg.title,
            body: push_msg.body,
        }
    }
}
