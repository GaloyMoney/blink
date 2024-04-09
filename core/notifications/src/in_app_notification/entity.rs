use crate::{
    notification_event::*, primitives::*, user_notification_settings::UserNotificationSettings,
};
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
        user_id: GaloyUserId,
        payload: NotificationEventPayload,
        settings: UserNotificationSettings,
    ) -> Self {
        let localized_msg = payload
            .to_localized_in_app_msg(settings.locale().unwrap_or_default())
            .unwrap();
        let deep_link = payload.deep_link();
        InAppNotification {
            id: InAppNotificationId::new(),
            user_id,
            title: localized_msg.title,
            body: localized_msg.body,
            deep_link,
            created_at: Utc::now(),
            read_at: None,
        }
    }
}
