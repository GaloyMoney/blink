use async_graphql::*;

pub struct Query;

#[Object]
impl Query {
    #[graphql(entity)]
    async fn consumer_account(&self, id: ID) -> Option<ConsumerAccount> {
        Some(ConsumerAccount { id })
    }
}

#[derive(SimpleObject)]
#[graphql(extends)]
#[graphql(complex)]
struct ConsumerAccount {
    #[graphql(external)]
    id: ID,
}

#[derive(SimpleObject)]
pub struct NotificationSettings {
    hello: String,
}

#[ComplexObject]
impl ConsumerAccount {
    async fn notification_settings(&self) -> NotificationSettings {
        unimplemented!()
    }
}
