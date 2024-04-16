use crate::{notification_event::*, primitives::*};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone)]
pub struct InAppNotification {
    pub id: InAppNotificationId,
    pub user_id: GaloyUserId,
    pub title: String,
    pub body: String,
    pub deep_link: Option<DeepLink>,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}
