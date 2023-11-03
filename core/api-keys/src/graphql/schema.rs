use async_graphql::*;
use chrono::{DateTime, Utc};

use crate::app::ApiKeysApp;

pub struct AuthSubject {
    pub id: String,
}

pub struct Query;

#[Object]
impl Query {
    #[graphql(entity)]
    async fn me(&self, id: ID) -> Option<User> {
        Some(User { id })
    }
}

#[derive(SimpleObject)]
pub(super) struct ApiKey {
    pub id: ID,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

#[derive(SimpleObject)]
#[graphql(extends)]
#[graphql(complex)]
struct User {
    #[graphql(external)]
    id: ID,
}

#[ComplexObject]
impl User {
    async fn api_keys(&self) -> Vec<ApiKey> {
        vec![ApiKey {
            id: ID::from("123"),
            name: "api-key".to_owned(),
            created_at: Utc::now(),
            expires_at: Utc::now() + chrono::Duration::days(30),
        }]
    }
}

#[derive(SimpleObject)]
pub(super) struct ApiKeyCreatePayload {
    pub api_key: ApiKey,
    pub api_key_secret: String,
}

pub struct Mutation;

#[derive(InputObject)]
struct ApiKeyCreateInput {
    name: String,
}

#[derive(InputObject)]
struct ApiKeyRevokeInput {
    id: ID,
}

#[Object]
impl Mutation {
    async fn api_key_create(
        &self,
        ctx: &Context<'_>,
        input: ApiKeyCreateInput,
    ) -> async_graphql::Result<ApiKeyCreatePayload> {
        let app = ctx.data_unchecked::<ApiKeysApp>();
        let subject = ctx.data::<AuthSubject>()?;
        let key = app
            .create_api_key_for_subject(&subject.id, input.name)
            .await?;
        Ok(ApiKeyCreatePayload::from(key))
    }

    async fn api_key_revoke(
        &self,
        _ctx: &Context<'_>,
        _input: ApiKeyRevokeInput,
    ) -> async_graphql::Result<bool> {
        Ok(true)
    }
}
