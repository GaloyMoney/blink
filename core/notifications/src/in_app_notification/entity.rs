use chrono::{DateTime, Utc};
use derive_builder::Builder;

use crate::{notification_event::*, primitives::*};

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

#[derive(Debug, Builder, Clone)]
pub struct NewInAppNotification {
    #[builder(setter(into))]
    pub id: InAppNotificationId,
    #[builder(setter(into))]
    pub user_id: GaloyUserId,
    #[builder(setter(into))]
    pub title: String,
    #[builder(setter(into))]
    pub body: String,
    #[builder(default, setter(into))]
    pub deep_link: Option<DeepLink>,
}

impl NewInAppNotification {
    pub fn builder(id: InAppNotificationId) -> NewInAppNotificationBuilder {
        let mut builder = NewInAppNotificationBuilder::default();
        builder.id(id);
        builder
    }
}
