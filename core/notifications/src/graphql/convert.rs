use async_graphql::ID;

use super::types;
use crate::in_app_notification;

impl From<in_app_notification::InAppNotification> for types::InAppNotification {
    fn from(notification: in_app_notification::InAppNotification) -> Self {
        Self {
            id: ID(notification.id.to_string()),
            title: notification.title,
            body: notification.body,
            deep_link: notification.deep_link.map(|d| d.to_link_string()),
            created_at: types::Timestamp::from(notification.created_at),
            read_at: notification.read_at.map(types::Timestamp::from),
        }
    }
}
