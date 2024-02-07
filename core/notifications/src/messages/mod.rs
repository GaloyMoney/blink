use rust_i18n::t;

use crate::{notification_event::*, primitives::*};

pub struct LocalizedMessage {
    pub title: String,
    pub body: String,
}

#[allow(dead_code)]
pub struct Messages {
    //
}

impl Messages {
    #[allow(dead_code)]
    pub fn new() -> Self {
        Self {}
    }

    #[allow(dead_code)]
    pub fn circle_grew(&self, locale: &str, event: &CircleGrew) -> LocalizedMessage {
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
        LocalizedMessage { title, body }
    }

    #[allow(dead_code)]
    pub fn circle_threshold_reached(
        &self,
        locale: &str,
        event: &CircleThresholdReached,
    ) -> LocalizedMessage {
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
        LocalizedMessage { title, body }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_circle_grew() {
        let messages = Messages::new();
        let event = CircleGrew {
            user_id: GaloyUserId::from("user_id".to_string()),
            circle_type: CircleType::Inner,
            this_month_circle_size: 1,
            all_time_circle_size: 2,
        };
        let localized_message = messages.circle_grew("en", &event);
        assert_eq!(localized_message.title, "Your Blink Circles are growing!");
        assert_eq!(
            localized_message.body,
            "Somebody was just added to your inner circle."
        );
    }

    #[test]
    fn test_threshold_reached() {
        let messages = Messages::new();
        let event = CircleThresholdReached {
            user_id: GaloyUserId::from("user_id".to_string()),
            circle_type: CircleType::Inner,
            time_frame: CircleTimeFrame::AllTime,
            threshold: 2,
        };
        let localized_message = messages.circle_threshold_reached("en", &event);
        assert_eq!(localized_message.title, "Nice Inner Circle! 🤙");
        assert_eq!(
            localized_message.body,
            "You have welcomed 2 people to Blink. Keep it up!"
        );

        let localized_message = messages.circle_threshold_reached("de", &event);
        assert_eq!(localized_message.title, "Schöner Innerer Kreis! 🤙");
        assert_eq!(
            localized_message.body,
            "Du hast 2 Menschen zu Blink begrüßt. Weiter so!"
        );
    }
}
