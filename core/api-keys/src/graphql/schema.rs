use async_graphql::*;
use chrono::{DateTime, Utc};

pub struct Query;

#[Object]
impl Query {
    #[graphql(entity)]
    async fn consumer_account(&self, id: ID) -> Option<ConsumerAccount> {
        let api_keys = vec![
            ApiKey {
                id: ID::from("1"),
                name: "KeyOne".to_owned(),
                created_at: Utc::now(),
                expiration: Utc::now() + chrono::Duration::days(30),
                last_use: Utc::now(),
                scopes: vec![Scope::Read, Scope::Create],
            },
            ApiKey {
                id: ID::from("2"),
                name: "KeyTwo".to_owned(),
                created_at: Utc::now(),
                expiration: Utc::now() + chrono::Duration::days(60),
                last_use: Utc::now(),
                scopes: vec![Scope::Read],
            },
        ];

        Some(ConsumerAccount { id, api_keys })
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
    last_use: DateTime<Utc>,
    scopes: Vec<Scope>,
}

#[derive(SimpleObject)]
#[graphql(extends)]
struct ConsumerAccount {
    #[graphql(external)]
    id: ID,
    api_keys: Vec<ApiKey>,
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
            last_use: Utc::now(),
            scopes: vec![],
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
