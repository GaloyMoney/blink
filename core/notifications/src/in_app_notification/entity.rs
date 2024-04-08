use crate::{notification_event::*, primitives::*};
use chrono::{DateTime, Utc};

pub struct InAppNotification {
    pub id: InAppNotificationId,
    pub user_id: GaloyUserId,
    pub payload: NotificationEventPayload,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}
