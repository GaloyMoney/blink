use async_graphql::*;

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn hello_world(&self) -> &str {
        "Hello, world!"
    }

    #[graphql(entity)]
    async fn consumer_account(&self, id: ID) -> Option<ConsumerAccount> {
        Some(ConsumerAccount {
            id,
            hello_world: "Hello, world!".to_string(),
        })
    }
}

#[derive(SimpleObject)]
#[graphql(extends)]
struct ConsumerAccount {
    #[graphql(external)]
    id: ID,
    hello_world: String,
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
