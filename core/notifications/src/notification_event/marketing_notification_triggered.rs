use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::{DeepLink, NotificationEvent};
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MarketingNotificationTriggered {
    pub push_content: HashMap<GaloyLocale, LocalizedPushMessage>,
    pub default_push_content: LocalizedPushMessage,
    pub deep_link: Option<DeepLink>,
}

impl NotificationEvent for MarketingNotificationTriggered {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Marketing
    }

    fn deep_link(&self) -> Option<DeepLink> {
        self.deep_link.clone()
    }

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        let msg = self
            .push_content
            .get(&locale)
            .unwrap_or(&self.default_push_content);

        msg.clone()
    }

    fn to_localized_email(&self, _locale: GaloyLocale) -> Option<LocalizedEmail> {
        None
    }

    fn should_send_email(&self) -> bool {
        false
    }

    fn should_send_in_app_msg(&self) -> bool {
        false
    }

    fn to_localized_in_app_msg(&self, _locale: GaloyLocale) -> Option<LocalizedInAppMessage> {
        None
    }
}
