use async_graphql::*;

// Define a simple query object
#[derive(Default)]
pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn hello_world(&self) -> &str {
        "Hello, world!"
    }
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
