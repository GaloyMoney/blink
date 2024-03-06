use serde::{Deserialize, Serialize};

use super::{DeepLink, NotificationEvent};
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MarketingNotificationRequested {
    pub users: UserSet,
    pub filter: Option<Filter>,
    pub push_source_content: LocalizedPushNotificationContent,
    pub push_translated_content: Vec<LocalizedPushNotificationContent>,
}

impl NotificationEvent for MarketingNotificationRequested {
    fn category(&self) -> UserNotificationCategory {
        unimplemented!()
    }

    fn deep_link(&self) -> DeepLink {
        DeepLink::None
    }

    fn to_localized_push_msg(&self, locale: GaloyLocale) -> LocalizedPushMessage {
        unimplemented!()
    }

    fn to_localized_email(&self, locale: GaloyLocale) -> Option<LocalizedEmail> {
        unimplemented!()
    }

    fn should_send_email(&self) -> bool {
        false
    }
}
