use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::NotificationEvent;
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LinkEmailReminder {}

impl NotificationEvent for LinkEmailReminder {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Security
    }

    fn should_send_push(&self) -> bool {
        true
    }

    fn to_localized_push_msg(&self, locale: &GaloyLocale) -> LocalizedPushMessage {
        let title = t!(
            "security.link_email_reminder.title",
            locale = locale.as_ref()
        )
        .to_string();
        let body = t!(
            "security.link_email_reminder.body",
            locale = locale.as_ref(),
        )
        .to_string();
        LocalizedPushMessage { title, body }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn push_msg_correctly_formatted() {
        let event = LinkEmailReminder {};
        let localized_message = event.to_localized_push_msg(&GaloyLocale::from("en".to_string()));
        assert_eq!(localized_message.title, "Link Email to Secure Account");
        assert_eq!(
            localized_message.body,
            "Link your email to secure your account and receive important updates"
        );
    }
}
