mod config;

use axum::{routing::get, Extension, Router};

use crate::{app::ApiKeysApp, graphql};

pub use config::*;

pub async fn run_server(config: ServerConfig, api_keys_app: ApiKeysApp) -> anyhow::Result<()> {
    let schema = graphql::schema(Some(api_keys_app));

    let app = Router::new()
        .route(
            "/graphql",
            get(playground).post(axum::routing::post(graphql::handler)),
        )
        .route("/auth/check-token", get(check_handler))
        .layer(Extension(schema));

    println!("Starting graphql server on port {}", config.port);
    axum::Server::bind(&std::net::SocketAddr::from(([0, 0, 0, 0], config.port)))
        .serve(app.into_make_service())
        .await?;
    Ok(())
}

async fn check_handler() -> impl axum::response::IntoResponse {
    println!("CHECK HELLO");
    use axum::http::StatusCode;
    let error_response =
        axum::response::Json(serde_json::json!({ "identity": { "id": "ashoten" }}));
    (StatusCode::INTERNAL_SERVER_ERROR, error_response)
}

async fn playground() -> impl axum::response::IntoResponse {
    axum::response::Html(async_graphql::http::playground_source(
        async_graphql::http::GraphQLPlaygroundConfig::new("/graphql"),
    ))
}
