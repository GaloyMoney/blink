use async_graphql::*;

pub struct Query;

#[Object]
impl Query {
    /// Returns the sum of a and b
    async fn add(&self, a: i32, b: i32) -> i32 {
        a + b + 1
    }
}

pub fn schema() -> Schema<Query, EmptyMutation, EmptySubscription> {
    Schema::build(Query, EmptyMutation, EmptySubscription).finish()
}
