use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::{DeepLink, NotificationEvent, NotificationEventError};
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CircleThresholdReached {
    pub user_id: GaloyUserId,
    pub circle_type: CircleType,
    pub time_frame: CircleTimeFrame,
    pub threshold: u32,
}

impl NotificationEvent for CircleThresholdReached {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Circles
    }

    fn user_id(&self) -> &GaloyUserId {
        &self.user_id
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::Circles
    }

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        let title = match self.circle_type {
            CircleType::Inner => t!(
                "circle_threshold_reached.inner.title",
                locale = locale.as_ref()
            ),
            CircleType::Outer => t!(
                "circle_threshold_reached.outer.title",
                locale = locale.as_ref()
            ),
        }
        .to_string();
        let time_frame = match self.time_frame {
            CircleTimeFrame::Month => t!("circle_time_frame.month", locale = locale.as_ref()),
            CircleTimeFrame::AllTime => t!("circle_time_frame.all_time", locale = locale.as_ref()),
        };
        let body = match self.circle_type {
            CircleType::Inner => t!(
                "circle_threshold_reached.inner.body",
                locale = locale.as_ref(),
                threshold = self.threshold,
                time_frame = time_frame
            ),
            CircleType::Outer => t!(
                "circle_threshold_reached.outer.body",
                locale = locale.as_ref(),
                threshold = self.threshold,
                time_frame = time_frame
            ),
        }
        .to_string();
        LocalizedPushMessage { title, body }
    }

    fn to_localized_email(
        &self,
        _locale: GaloyLocale,
    ) -> Result<Option<LocalizedEmail>, NotificationEventError> {
        Ok(None)
    }

    fn should_send_email(&self) -> bool {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_circle_threshold_reached() {
        let event = CircleThresholdReached {
            user_id: GaloyUserId::from("user_id".to_string()),
            circle_type: CircleType::Inner,
            time_frame: CircleTimeFrame::AllTime,
            threshold: 2,
        };
        let localized_message = event.to_localized_push_msg(GaloyLocale::from("en".to_string()));
        assert_eq!(localized_message.title, "Nice Inner Circle! 🤙");
        assert_eq!(
            localized_message.body,
            "You have welcomed 2 people to Blink. Keep it up!"
        );
    }
}
