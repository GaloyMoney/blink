use crate::{messages::*, notification_event::*, primitives::*};
use chrono::{DateTime, Utc};

pub struct InAppNotification {
    pub id: InAppNotificationId,
    pub user_id: GaloyUserId,
    pub title: String,
    pub body: String,
    pub deep_link: Option<DeepLink>,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}

impl InAppNotification {
    pub fn new(
        user_id: &GaloyUserId,
        msg: LocalizedInAppMessage,
        deep_link: Option<DeepLink>,
    ) -> Self {
        Self {
            id: InAppNotificationId::new(),
            user_id: user_id.clone(),
            title: msg.title,
            body: msg.body,
            deep_link,
            created_at: Utc::now(),
            read_at: None,
        }
    }
}
