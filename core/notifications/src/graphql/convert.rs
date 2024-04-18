use async_graphql::ID;

use super::types;
use crate::{history, primitives::StatefulNotificationId};

impl From<history::StatefulNotification> for types::StatefulNotification {
    fn from(notification: history::StatefulNotification) -> Self {
        let created_at = notification.created_at();
        let acknowledeg_at = notification.acknowledged_at();
        Self {
            id: ID(notification.id.to_string()),
            title: notification.title,
            body: notification.body,
            deep_link: notification.deep_link.clone().map(|d| d.to_link_string()),
            created_at: types::Timestamp::from(created_at),
            acknowledge_at: acknowledeg_at.map(types::Timestamp::from),
        }
    }
}

impl From<StatefulNotificationId> for types::StatefulNotificationsByCreatedAtCursor {
    fn from(id: StatefulNotificationId) -> Self {
        Self { id }
    }
}
