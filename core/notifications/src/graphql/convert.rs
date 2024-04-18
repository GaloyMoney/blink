use async_graphql::ID;

use super::types;
use crate::history;

impl From<history::StatefulNotification> for types::StatefulNotification {
    fn from(notification: history::StatefulNotification) -> Self {
        let created_at = notification.created_at();
        let read_at = notification.read_at();
        Self {
            id: ID(notification.id.to_string()),
            title: notification.title,
            body: notification.body,
            deep_link: notification.deep_link.clone().map(|d| d.to_link_string()),
            created_at: types::Timestamp::from(created_at),
            read_at: read_at.map(types::Timestamp::from),
        }
    }
}
