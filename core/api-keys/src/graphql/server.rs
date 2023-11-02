use async_graphql::{EmptySubscription, Schema};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{routing::get, Extension, Router};

use crate::app::ApiKeysApp;

use super::{config::*, schema::*};

pub async fn run_server(config: ServerConfig, api_keys_app: ApiKeysApp) {
    let schema = Schema::build(Query, Mutation, EmptySubscription)
        .data(api_keys_app)
        .finish();

    let app = Router::new()
        .route(
            "/graphql",
            get(playground).post(axum::routing::post(graphql_handler)),
        )
        .route("/auth/check-token", get(check_handler))
        .layer(Extension(schema));

    println!("Starting graphql server on port {}", config.port);
    axum::Server::bind(&std::net::SocketAddr::from(([0, 0, 0, 0], config.port)))
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn check_handler() -> impl axum::response::IntoResponse {
    println!("CHECK HELLO");
    use axum::http::StatusCode;
    let error_response =
        axum::response::Json(serde_json::json!({ "identity": { "id": "ashoten" }}));
    (StatusCode::INTERNAL_SERVER_ERROR, error_response)
}

async fn graphql_handler(
    schema: Extension<Schema<Query, Mutation, EmptySubscription>>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let req = req.into_inner();
    schema.execute(req).await.into()
}

async fn playground() -> impl axum::response::IntoResponse {
    axum::response::Html(async_graphql::http::playground_source(
        async_graphql::http::GraphQLPlaygroundConfig::new("/graphql"),
    ))
}
