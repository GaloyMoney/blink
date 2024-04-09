use crate::{messages::LocalizedInAppMessage, notification_event::*, primitives::*};
use chrono::{DateTime, Utc};

pub struct InAppNotification {
    pub id: InAppNotificationId,
    pub user_id: GaloyUserId,
    pub title: String,
    pub body: String,
    pub deep_link: Option<String>,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}

impl InAppNotification {
    pub fn new(
        user_id: GaloyUserId,
        localized_msg: LocalizedInAppMessage,
        deep_link: Option<DeepLink>,
    ) -> Self {
        InAppNotification {
            id: InAppNotificationId::new(),
            user_id,
            title: localized_msg.title,
            body: localized_msg.body,
            deep_link: deep_link.map(|dl| dl.to_link_string()),
            created_at: Utc::now(),
            read_at: None,
        }
    }
}
