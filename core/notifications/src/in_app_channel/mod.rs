pub mod error;

use chrono::{DateTime, Utc};
use sqlx::PgPool;

use crate::{
    messages::LocalizedInAppMessage, notification_event::DeepLink, primitives::GaloyUserId,
};

pub use error::*;

#[derive(Debug, Clone)]
pub struct InAppChannel {
    _pool: PgPool,
}

impl InAppChannel {
    pub fn new(pool: &PgPool) -> Self {
        InAppChannel {
            _pool: pool.clone(),
        }
    }

    pub async fn send_msg(
        &self,
        _user_id: &GaloyUserId,
        _msg: LocalizedInAppMessage,
        _deep_link: Option<DeepLink>,
    ) -> Result<(), InAppChannelError> {
        unimplemented!()
    }

    pub async fn msgs_for_user(
        &self,
        _user_id: &GaloyUserId,
        _only_unread: bool,
    ) -> Result<Vec<InAppNotification>, InAppChannelError> {
        unimplemented!()
    }
}

pub struct InAppNotificationId(String);

impl From<String> for InAppNotificationId {
    fn from(id: String) -> Self {
        InAppNotificationId(id)
    }
}

impl AsRef<str> for InAppNotificationId {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for InAppNotificationId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

pub struct InAppNotification {
    pub id: InAppNotificationId,
    pub user_id: GaloyUserId,
    pub title: String,
    pub body: String,
    pub deep_link: Option<DeepLink>,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}
