use async_graphql::*;
use chrono::{DateTime, Utc};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
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

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn hello_world_mutation(&self) -> &str {
        "Hello, world!"
    }
}

pub fn schema() -> Schema<QueryRoot, MutationRoot, EmptySubscription> {
    Schema::build(QueryRoot, MutationRoot, EmptySubscription).finish()
}
