use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::{DeepLink, NotificationEvent, SingleUserEvent};
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CircleGrew {
    pub user_id: GaloyUserId,
    pub circle_type: CircleType,
    pub this_month_circle_size: u32,
    pub all_time_circle_size: u32,
}

impl SingleUserEvent for CircleGrew {
    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }
}

impl NotificationEvent for CircleGrew {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Circles
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::Circles
    }

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        let circle_type = match self.circle_type {
            CircleType::Inner => t!("circle_type.inner", locale = locale.as_ref()),
            CircleType::Outer => t!("circle_type.outer", locale = locale.as_ref()),
        };
        let title = t!("circle_grew.title", locale = locale.as_ref()).to_string();
        let body = t!(
            "circle_grew.body",
            locale = locale.as_ref(),
            circle_type = circle_type
        )
        .to_string();
        LocalizedPushMessage { title, body }
    }

    fn to_localized_email(&self, _locale: GaloyLocale) -> Option<LocalizedEmail> {
        None
    }

    fn should_send_email(&self) -> bool {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn push_msg_correctly_formatted() {
        let event = CircleGrew {
            user_id: GaloyUserId::from("user_id".to_string()),
            circle_type: CircleType::Inner,
            this_month_circle_size: 1,
            all_time_circle_size: 2,
        };
        let localized_message = event.to_localized_push_msg(GaloyLocale::from("en".to_string()));
        assert_eq!(localized_message.title, "Your Blink Circles are growing!");
        assert_eq!(
            localized_message.body,
            "Somebody was just added to your inner circle."
        );
    }
}
