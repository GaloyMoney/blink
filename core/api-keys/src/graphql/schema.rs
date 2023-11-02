use async_graphql::*;
use chrono::{DateTime, Utc};

use crate::app::ApiKeysApp;

pub struct Query;

#[Object]
impl Query {
    #[graphql(entity)]
    async fn consumer_account(&self, id: ID) -> Option<ConsumerAccount> {
        Some(ConsumerAccount { id })
    }
}

#[derive(SimpleObject)]
struct ApiKey {
    id: ID,
    name: String,
    created_at: DateTime<Utc>,
    expiration: DateTime<Utc>,
}

#[derive(SimpleObject)]
#[graphql(extends)]
#[graphql(complex)]
struct ConsumerAccount {
    #[graphql(external)]
    id: ID,
}

#[ComplexObject]
impl ConsumerAccount {
    async fn api_keys(&self) -> Vec<ApiKey> {
        vec![ApiKey {
            id: ID::from("123"),
            name: "api-key".to_owned(),
            created_at: Utc::now(),
            expiration: Utc::now() + chrono::Duration::days(30),
        }]
    }
}

#[derive(SimpleObject)]
struct ApiKeyCreatePayload {
    api_key: ApiKey,
    api_key_secret: String,
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
        let _key = app.create_api_key(input.name).await?;
        let api_key = ApiKey {
            id: ID::from("123"),
            name: "GeneratedApiKey".to_owned(),
            created_at: Utc::now(),
            expiration: Utc::now() + chrono::Duration::days(30),
        };

        Ok(ApiKeyCreatePayload {
            api_key,
            api_key_secret: "secret".to_owned(),
        })
    }

    async fn api_key_revoke(
        &self,
        _ctx: &Context<'_>,
        _input: ApiKeyRevokeInput,
    ) -> async_graphql::Result<bool> {
        Ok(true)
    }
}
