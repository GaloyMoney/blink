use async_graphql::{types::connection::*, *};
use chrono::{DateTime, TimeZone, Utc};
use serde::{Deserialize, Serialize};

use crate::primitives::{GaloyLocale, StatefulNotificationId};

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

#[derive(Clone)]
pub struct Language(String);

impl From<GaloyLocale> for Language {
    fn from(locale: GaloyLocale) -> Self {
        Language(locale.as_ref().to_string())
    }
}

impl Default for Language {
    fn default() -> Self {
        Language("".to_string())
    }
}

#[Scalar(name = "Language")]
impl ScalarType for Language {
    fn parse(value: async_graphql::Value) -> async_graphql::InputValueResult<Self> {
        match &value {
            async_graphql::Value::String(s) => Ok(Language(s.clone())),
            _ => Err(async_graphql::InputValueError::expected_type(value)),
        }
    }

    fn to_value(&self) -> async_graphql::Value {
        async_graphql::Value::String(self.0.clone())
    }
}

#[derive(SimpleObject)]
pub(super) struct StatefulNotification {
    pub id: ID,
    pub title: String,
    pub body: String,
    pub deep_link: Option<String>,
    pub created_at: Timestamp,
    pub acknowledged_at: Option<Timestamp>,
}

#[derive(Debug, Serialize, Deserialize)]
pub(super) struct StatefulNotificationsByCreatedAtCursor {
    pub id: StatefulNotificationId,
}

impl CursorType for StatefulNotificationsByCreatedAtCursor {
    type Error = String;

    fn encode_cursor(&self) -> String {
        use base64::{engine::general_purpose, Engine as _};
        let json = serde_json::to_string(&self).expect("could not serialize token");
        general_purpose::STANDARD_NO_PAD.encode(json.as_bytes())
    }

    fn decode_cursor(s: &str) -> Result<Self, Self::Error> {
        use base64::{engine::general_purpose, Engine as _};
        let bytes = general_purpose::STANDARD_NO_PAD
            .decode(s.as_bytes())
            .map_err(|e| e.to_string())?;
        let json = String::from_utf8(bytes).map_err(|e| e.to_string())?;
        serde_json::from_str(&json).map_err(|e| e.to_string())
    }
}
