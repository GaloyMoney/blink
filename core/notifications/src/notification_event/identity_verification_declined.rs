use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::NotificationEvent;
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum IdentityVerificationDeclinedReason {
    DocumentsNotClear,
    SelfieNotClear,
    DocumentsNotSupported,
    DocumentsExpired,
    DocumentsDoNotMatch,
    Other,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IdentityVerificationDeclined {
    pub declined_reason: IdentityVerificationDeclinedReason,
}

impl NotificationEvent for IdentityVerificationDeclined {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::AdminNotification
    }

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        let reason = self.localized_declined_reason(&locale);
        let title = t!(
            "identity_verification_declined.title",
            locale = locale.as_ref()
        )
        .to_string();
        let body = t!(
            "identity_verification_declined.body",
            locale = locale.as_ref(),
            reason = reason
        )
        .to_string();
        LocalizedPushMessage { title, body }
    }

    fn should_send_email(&self) -> bool {
        true
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        let email_formatter = EmailFormatter::new();

        let reason = self.localized_declined_reason(&locale);
        let title = t!(
            "identity_verification_declined.title",
            locale = locale.as_ref()
        )
        .to_string();
        let body = t!(
            "identity_verification_declined.body",
            locale = locale.as_ref(),
            reason = reason
        )
        .to_string();

        let body = email_formatter.generic_email_template(&title, &body);

        Some(LocalizedEmail {
            subject: title,
            body,
        })
    }
}

impl IdentityVerificationDeclined {
    fn localized_declined_reason(&self, locale: &GaloyLocale) -> String {
        let reason = match self.declined_reason {
            IdentityVerificationDeclinedReason::DocumentsNotClear => {
                t!(
                    "identity_verification_declined.reason.documents_not_clear",
                    locale = locale.as_ref()
                )
            }
            IdentityVerificationDeclinedReason::SelfieNotClear => {
                t!(
                    "identity_verification_declined.reason.photo_not_clear",
                    locale = locale.as_ref()
                )
            }
            IdentityVerificationDeclinedReason::DocumentsNotSupported => {
                t!(
                    "identity_verification_declined.reason.documents_not_supported",
                    locale = locale.as_ref()
                )
            }
            IdentityVerificationDeclinedReason::DocumentsExpired => {
                t!(
                    "identity_verification_declined.reason.documents_expired",
                    locale = locale.as_ref()
                )
            }
            IdentityVerificationDeclinedReason::DocumentsDoNotMatch => {
                t!(
                    "identity_verification_declined.reason.documents_do_not_match",
                    locale = locale.as_ref()
                )
            }
            IdentityVerificationDeclinedReason::Other => {
                t!(
                    "identity_verification_declined.reason.other",
                    locale = locale.as_ref()
                )
            }
        };
        reason.to_string()
    }
}
