use serde::{Deserialize, Serialize};

use super::{DeepLink, NotificationEvent};
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PriceOfOneBitcoin {
    pub minor_units: u64,
    pub currency: Currency,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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
        self.currency.format_minor_units(f, self.minor_units)
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
    pub fn should_notify(&self) -> bool {
        self.change_percent >= Self::NOTIFICATION_THRESHOLD
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
        unimplemented!()
    }

    fn to_localized_email(&self, _locale: GaloyLocale) -> Option<LocalizedEmail> {
        None
    }

    fn should_send_email(&self) -> bool {
        false
    }
}
