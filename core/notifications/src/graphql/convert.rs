use async_graphql::ID;

use super::types;
use crate::{history, primitives::StatefulNotificationId};

impl From<history::StatefulNotification> for types::StatefulNotification {
    fn from(notification: history::StatefulNotification) -> Self {
        let created_at = notification.created_at();
        let acknowledeg_at = notification.acknowledged_at();
        Self {
            deep_link: notification.deep_link().map(|d| d.to_link_string()),
            id: ID(notification.id.to_string()),
            title: notification.message.title.clone(),
            body: notification.message.body.clone(),
            created_at: types::Timestamp::from(created_at),
            acknowledged_at: acknowledeg_at.map(types::Timestamp::from),
            bulletin_enabled: notification.add_to_bulletin(),
        }
    }
}

impl From<StatefulNotificationId> for types::StatefulNotificationsByCreatedAtCursor {
    fn from(id: StatefulNotificationId) -> Self {
        Self { id }
    }
}
