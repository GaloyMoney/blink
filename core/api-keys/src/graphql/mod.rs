mod schema;

use async_graphql::*;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::Extension;

use crate::app::ApiKeysApp;
use schema::*;

pub fn schema(app: Option<ApiKeysApp>) -> Schema<Query, Mutation, EmptySubscription> {
    let schema = Schema::build(Query, Mutation, EmptySubscription);
    if let Some(app) = app {
        schema.data(app).finish()
    } else {
        schema.finish()
    }
}

pub async fn handler(
    schema: Extension<Schema<Query, Mutation, EmptySubscription>>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let req = req.into_inner();
    schema.execute(req).await.into()
}
