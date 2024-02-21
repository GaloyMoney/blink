use handlebars::Handlebars;
use rust_i18n::t;

use crate::{notification_event::*, primitives::*};

pub struct LocalizedPushMessage {
    pub title: String,
    pub body: String,
}

pub struct PushMessages {}

impl PushMessages {
    pub fn circle_grew(locale: &str, event: &CircleGrew) -> LocalizedPushMessage {
        let circle_type = match event.circle_type {
            CircleType::Inner => t!("circle_type.inner", locale = locale),
            CircleType::Outer => t!("circle_type.outer", locale = locale),
        };
        let title = t!("circle_grew.title", locale = locale).to_string();
        let body = t!(
            "circle_grew.body",
            locale = locale,
            circle_type = circle_type
        )
        .to_string();
        LocalizedPushMessage { title, body }
    }

    pub fn circle_threshold_reached(
        locale: &str,
        event: &CircleThresholdReached,
    ) -> LocalizedPushMessage {
        let title = match event.circle_type {
            CircleType::Inner => t!("circle_threshold_reached.inner.title", locale = locale),
            CircleType::Outer => t!("circle_threshold_reached.outer.title", locale = locale),
        }
        .to_string();
        let time_frame = match event.time_frame {
            CircleTimeFrame::Month => t!("circle_time_frame.month", locale = locale),
            CircleTimeFrame::AllTime => t!("circle_time_frame.all_time", locale = locale),
        };
        let body = match event.circle_type {
            CircleType::Inner => t!(
                "circle_threshold_reached.inner.body",
                locale = locale,
                threshold = event.threshold,
                time_frame = time_frame
            ),
            CircleType::Outer => t!(
                "circle_threshold_reached.outer.body",
                locale = locale,
                threshold = event.threshold,
                time_frame = time_frame
            ),
        }
        .to_string();
        LocalizedPushMessage { title, body }
    }

    pub fn identity_verification_approved(
        locale: &str,
        _event: &IdentityVerificationApproved,
    ) -> LocalizedPushMessage {
        let title = t!("identity_verification_approved.title", locale = locale).to_string();
        let body = t!("identity_verification_approved.body", locale = locale).to_string();
        LocalizedPushMessage { title, body }
    }

    pub fn identity_verification_declined(
        locale: &str,
        event: &IdentityVerificationDeclined,
    ) -> LocalizedPushMessage {
        let reason = match event.declined_reason {
            IdentityVerificationDeclinedReason::DocumentsNotClear => {
                t!(
                    "identity_verification_declined.reason.documents_not_clear",
                    locale = locale
                )
            }
            IdentityVerificationDeclinedReason::SelfieNotClear => {
                t!(
                    "identity_verification_declined.reason.photo_not_clear",
                    locale = locale
                )
            }
            IdentityVerificationDeclinedReason::DocumentsNotSupported => {
                t!(
                    "identity_verification_declined.reason.documents_not_supported",
                    locale = locale
                )
            }
            IdentityVerificationDeclinedReason::DocumentsExpired => {
                t!(
                    "identity_verification_declined.reason.documents_expired",
                    locale = locale
                )
            }
            IdentityVerificationDeclinedReason::DocumentsDoNotMatch => {
                t!(
                    "identity_verification_declined.reason.documents_do_not_match",
                    locale = locale
                )
            }
            IdentityVerificationDeclinedReason::Other => {
                t!(
                    "identity_verification_declined.reason.other",
                    locale = locale
                )
            }
        };
        let title = t!("identity_verification_declined.title", locale = locale).to_string();
        let body = t!(
            "identity_verification_declined.body",
            locale = locale,
            reason = reason
        )
        .to_string();
        LocalizedPushMessage { title, body }
    }

    pub fn identity_verification_review_pending(
        locale: &str,
        _event: &IdentityVerificationReviewPending,
    ) -> LocalizedPushMessage {
        let title = t!(
            "identity_verification_review_pending.title",
            locale = locale
        )
        .to_string();
        let body = t!("identity_verification_review_pending.body", locale = locale).to_string();
        LocalizedPushMessage { title, body }
    }
}

pub struct LocalizedEmail {
    pub subject: String,
    pub body: String,
}

pub struct EmailMessages {}

impl EmailMessages {
    pub fn circle_grew(_locale: &str, _event: &CircleGrew) -> Option<LocalizedEmail> {
        None
    }

    pub fn circle_threshold_reached(
        _locale: &str,
        _event: &CircleThresholdReached,
    ) -> Option<LocalizedEmail> {
        None
    }

    pub fn identity_verification_approved(
        locale: &str,
        _event: &IdentityVerificationApproved,
        handlebars: &Handlebars,
    ) -> Option<LocalizedEmail> {
        let title = t!("identity_verification_approved.title", locale = locale).to_string();
        let body = t!("identity_verification_approved.body", locale = locale).to_string();
        let data = serde_json::json!({
            "subject": &title,
            "body": &body
        });
        // use error handling here
        let body = handlebars.render("identification", &data).ok()?;

        Some(LocalizedEmail {
            subject: title,
            body,
        })
    }

    pub fn identity_verification_declined(
        _locale: &str,
        _event: &IdentityVerificationDeclined,
    ) -> Option<LocalizedEmail> {
        None
    }

    pub fn identity_verification_review_pending(
        _locale: &str,
        _event: &IdentityVerificationReviewPending,
    ) -> Option<LocalizedEmail> {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_circle_grew() {
        let event = CircleGrew {
            user_id: GaloyUserId::from("user_id".to_string()),
            circle_type: CircleType::Inner,
            this_month_circle_size: 1,
            all_time_circle_size: 2,
        };
        let localized_message = PushMessages::circle_grew("en", &event);
        assert_eq!(localized_message.title, "Your Blink Circles are growing!");
        assert_eq!(
            localized_message.body,
            "Somebody was just added to your inner circle."
        );
    }

    #[test]
    fn test_threshold_reached() {
        let event = CircleThresholdReached {
            user_id: GaloyUserId::from("user_id".to_string()),
            circle_type: CircleType::Inner,
            time_frame: CircleTimeFrame::AllTime,
            threshold: 2,
        };
        let localized_message = PushMessages::circle_threshold_reached("en", &event);
        assert_eq!(localized_message.title, "Nice Inner Circle! 🤙");
        assert_eq!(
            localized_message.body,
            "You have welcomed 2 people to Blink. Keep it up!"
        );

        let localized_message = PushMessages::circle_threshold_reached("de", &event);
        assert_eq!(localized_message.title, "Schöner Innerer Kreis! 🤙");
        assert_eq!(
            localized_message.body,
            "Du hast 2 Menschen zu Blink begrüßt. Weiter so!"
        );
    }
}
