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
        if last_trigger.is_none() {
            return true;
        }

        (chrono::Utc::now() - last_trigger.expect("already asserted")) > Self::COOL_OFF_PERIOD
            && self.change_percent >= Self::NOTIFICATION_THRESHOLD
            && self.direction == PriceChangeDirection::Up
    }
}

impl NotificationEvent for PriceChanged {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Payments
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_push_msg(&self, _locale: GaloyLocale) -> LocalizedPushMessage {
        let title = t!("price_changed.title").to_string();
        let body = t!(
            "price_changed.body",
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
                currency: Currency::Iso(rusty_money::iso::USD),
            },
            direction: PriceChangeDirection::Up,
            change_percent: ChangePercentage(5.1),
        };
        assert!(price_changed.should_notify());
    }

    #[test]
    fn price_changed_should_not_notify() {
        let price_changed = PriceChanged {
            price: PriceOfOneBitcoin {
                minor_units: 100_000,
                currency: Currency::Iso(rusty_money::iso::USD),
            },
            direction: PriceChangeDirection::Up,
            change_percent: ChangePercentage(4.9),
        };
        assert!(!price_changed.should_notify());
    }

    #[test]
    fn price_changed_push_notification() {
        let price_changed = PriceChanged {
            price: PriceOfOneBitcoin {
                minor_units: 100_000,
                currency: Currency::Iso(rusty_money::iso::USD),
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
