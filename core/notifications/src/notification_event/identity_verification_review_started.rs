use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::NotificationEvent;
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IdentityVerificationReviewStarted {}

impl NotificationEvent for IdentityVerificationReviewStarted {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::AdminNotification
    }

    fn should_send_push(&self) -> bool {
        true
    }

    fn to_localized_push_msg(&self, locale: &GaloyLocale) -> LocalizedPushMessage {
        let title = t!(
            "identity_verification_review_started.title",
            locale = locale.as_ref()
        )
        .to_string();
        let body = t!(
            "identity_verification_review_started.body",
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
            "identity_verification_review_started.title",
            locale = locale.as_ref()
        )
        .to_string();
        let body = t!(
            "identity_verification_review_started.body",
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
        let title = t!(
            "identity_verification_review_started.title",
            locale = locale.as_ref()
        )
        .to_string();
        let body = t!(
            "identity_verification_review_started.body",
            locale = locale.as_ref()
        )
        .to_string();
        LocalizedStatefulMessage {
            locale,
            title,
            body,
        }
    }
}
