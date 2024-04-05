use async_graphql::*;
use chrono::{DateTime, TimeZone, Utc};

use crate::primitives::*;

#[derive(SimpleObject)]
pub(super) struct UserNotificationSettings {
    pub push: UserNotificationChannelSettings,
}

#[derive(SimpleObject)]
pub(super) struct UserNotificationChannelSettings {
    pub enabled: bool,
    pub disabled_categories: Vec<UserNotificationCategory>,
}

#[derive(Clone, Copy)]
pub struct Timestamp(DateTime<Utc>);
impl From<DateTime<Utc>> for Timestamp {
    fn from(dt: DateTime<Utc>) -> Self {
        Timestamp(dt)
    }
}
impl From<Timestamp> for DateTime<Utc> {
    fn from(Timestamp(dt): Timestamp) -> Self {
        dt
    }
}

#[Scalar(name = "Timestamp")]
impl ScalarType for Timestamp {
    fn parse(value: async_graphql::Value) -> async_graphql::InputValueResult<Self> {
        let epoch = match &value {
            async_graphql::Value::Number(n) => n
                .as_i64()
                .ok_or_else(|| async_graphql::InputValueError::expected_type(value)),
            _ => Err(async_graphql::InputValueError::expected_type(value)),
        }?;

        Utc.timestamp_opt(epoch, 0)
            .single()
            .map(Timestamp)
            .ok_or_else(|| async_graphql::InputValueError::custom("Invalid timestamp"))
    }

    fn to_value(&self) -> async_graphql::Value {
        async_graphql::Value::Number(self.0.timestamp().into())
    }
}

#[derive(SimpleObject)]
pub(super) struct InAppNotification {
    pub id: ID,
    pub title: String,
    pub body: String,
    pub deep_link: Option<String>,
    pub created_at: Timestamp,
    pub read_at: Option<Timestamp>,
}
