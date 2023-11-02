use async_graphql::*;
use chrono::{DateTime, Utc};

pub struct Query;

#[Object]
impl Query {
    #[graphql(entity)]
    async fn consumer_account(&self, id: ID) -> Option<ConsumerAccount> {
        Some(ConsumerAccount { id })
    }
}

#[derive(Enum, Clone, Copy, Debug, PartialEq, Eq)]
enum Scope {
    Create,
    Read,
    Update,
    Delete,
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
    async fn api_key(&self) -> Vec<ApiKey> {
        Vec::new()
    }
}

#[derive(SimpleObject)]
struct ApiKeyCreatePayload {
    key_id: ID,
    api_key: ApiKey,
}

pub struct Mutation;

#[Object]
impl Mutation {
    async fn api_keys_create(&self) -> Result<ApiKeyCreatePayload> {
        let api_key = ApiKey {
            id: ID::from("123"),
            name: "GeneratedApiKey".to_owned(),
            created_at: Utc::now(),
            expiration: Utc::now() + chrono::Duration::days(30),
        };

        Ok(ApiKeyCreatePayload {
            key_id: ID::from("123"),
            api_key,
        })
    }
}

pub fn schema() -> Schema<Query, Mutation, EmptySubscription> {
    Schema::build(Query, Mutation, EmptySubscription).finish()
}
