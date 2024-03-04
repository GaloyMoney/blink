use rust_i18n::t;
use serde::{Deserialize, Serialize};

use super::{DeepLink, NotificationEvent};
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PriceOfOneBitcoin {
    pub minor_units: u64,
    pub currency: Currency,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum PriceChangeDirection {
    Up,
    Down,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd)]
#[serde(transparent)]
pub struct ChangePercentage(f64);
impl From<f64> for ChangePercentage {
    fn from(value: f64) -> Self {
        Self(value)
    }
}

impl std::fmt::Display for PriceOfOneBitcoin {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.currency.format_minor_units(f, self.minor_units, true)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PriceChanged {
    pub price: PriceOfOneBitcoin,
    pub direction: PriceChangeDirection,
    pub change_percent: ChangePercentage,
}

impl PriceChanged {
    const NOTIFICATION_THRESHOLD: ChangePercentage = ChangePercentage(5.0);
    const COOL_OFF_PERIOD: chrono::Duration = chrono::Duration::days(2);

    pub fn should_notify(&self, last_trigger: Option<chrono::DateTime<chrono::Utc>>) -> bool {
        if self.change_percent >= Self::NOTIFICATION_THRESHOLD
            && self.direction == PriceChangeDirection::Up
        {
            match last_trigger {
                Some(last_trigger_time) => {
                    let time_since_last_trigger = chrono::Utc::now() - last_trigger_time;
                    time_since_last_trigger > Self::COOL_OFF_PERIOD
                }
                None => true,
            }
        } else {
            false
        }
    }
}

impl NotificationEvent for PriceChanged {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Payments
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        let title = t!("price_changed.title", locale = locale.as_ref()).to_string();
        let body = t!(
            "price_changed.body",
            locale = locale.as_ref(),
            percent_increase = format!("{:.1}", self.change_percent.0),
            price = self.price.to_string()
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
    fn price_changed_should_notify() {
        let price_changed = PriceChanged {
            price: PriceOfOneBitcoin {
                minor_units: 100_000,
                currency: "USD".parse().unwrap(),
            },
            direction: PriceChangeDirection::Up,
            change_percent: ChangePercentage(5.1),
        };
        assert!(price_changed.should_notify(None));
        assert!(price_changed.should_notify(Some(chrono::Utc::now() - chrono::Duration::days(3))));
    }

    #[test]
    fn price_changed_should_not_notify_on_price_drops() {
        let price_changed = PriceChanged {
            price: PriceOfOneBitcoin {
                minor_units: 100_000,
                currency: "USD".parse().unwrap(),
            },
            direction: PriceChangeDirection::Down,
            change_percent: ChangePercentage(5.1),
        };
        assert!(!price_changed.should_notify(None));
    }

    #[test]
    fn price_changed_should_not_notify_when_percentage_under_threshold() {
        let price_changed = PriceChanged {
            price: PriceOfOneBitcoin {
                minor_units: 100_000,
                currency: "USD".parse().unwrap(),
            },
            direction: PriceChangeDirection::Up,
            change_percent: ChangePercentage(4.9),
        };
        assert!(!price_changed.should_notify(None));
    }

    #[test]
    fn price_changed_should_not_notify_when_last_triggered_too_recent() {
        let price_changed = PriceChanged {
            price: PriceOfOneBitcoin {
                minor_units: 100_000,
                currency: "USD".parse().unwrap(),
            },
            direction: PriceChangeDirection::Up,
            change_percent: ChangePercentage(5.1),
        };
        assert!(!price_changed.should_notify(Some(chrono::Utc::now())));
    }

    #[test]
    fn price_changed_push_notification() {
        let price_changed = PriceChanged {
            price: PriceOfOneBitcoin {
                minor_units: 100_000,
                currency: "USD".parse().unwrap(),
            },
            direction: PriceChangeDirection::Up,
            change_percent: ChangePercentage(5.13),
        };
        let localized_message =
            price_changed.to_localized_push_msg(GaloyLocale::from("en".to_string()));
        assert_eq!(localized_message.title, "Bitcoin is on the move!");
        assert_eq!(
            localized_message.body,
            "Bitcoin is up 5.1% in the last day to $1,000!"
        );
    }
}
