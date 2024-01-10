mod convert;
mod schema;

use async_graphql::*;

pub use schema::*;

use crate::app::NotificationsApp;

pub fn schema(app: Option<NotificationsApp>) -> Schema<Query, Mutation, EmptySubscription> {
    let schema = Schema::build(Query, Mutation, EmptySubscription);
    if let Some(app) = app {
        schema.data(app).finish()
    } else {
        schema.finish()
    }
}
