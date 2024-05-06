use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use super::{Action, DeepLink, NotificationEvent};
use crate::{messages::*, primitives::*};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MarketingNotificationTriggered {
    pub content: HashMap<GaloyLocale, LocalizedStatefulMessage>,
    pub default_content: LocalizedStatefulMessage,
    pub should_send_push: bool,
    pub should_add_to_history: bool,
    pub should_add_to_bulletin: bool,
    pub deep_link: Option<DeepLink>,
    #[serde(default)]
    pub action: Option<Action>,
}

impl NotificationEvent for MarketingNotificationTriggered {
    fn category(&self) -> UserNotificationCategory {
        UserNotificationCategory::Marketing
    }

    fn action(&self) -> Option<Action> {
        self.action.clone()
    }

    fn should_send_push(&self) -> bool {
        self.should_send_push
    }

    fn to_localized_push_msg(&self, locale: &GaloyLocale) -> LocalizedPushMessage {
        let msg = self.content.get(locale).unwrap_or(&self.default_content);

        LocalizedPushMessage {
            title: msg.title.clone(),
            body: msg.body.clone(),
        }
    }

    fn should_be_added_to_history(&self) -> bool {
        self.should_add_to_history
    }

    fn should_be_added_to_bulletin(&self) -> bool {
        self.should_add_to_bulletin
    }

    fn to_localized_persistent_message(&self, locale: GaloyLocale) -> LocalizedStatefulMessage {
        self.content
            .get(&locale)
            .unwrap_or(&self.default_content)
            .clone()
    }
}
