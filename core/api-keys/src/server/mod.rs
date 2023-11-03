mod config;
mod jwks;

use async_graphql::*;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{extract::State, routing::get, Extension, Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{
    app::{ApiKeysApp, ApplicationError},
    graphql,
};

pub use config::*;
use jwks::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct OathkeeperClaims {
    sub: String,
    exp: u64,
}

pub async fn run_server(config: ServerConfig, api_keys_app: ApiKeysApp) -> anyhow::Result<()> {
    let schema = graphql::schema(Some(api_keys_app.clone()));

    let jwks_decoder = Arc::new(RemoteJwksDecoder::new(config.oathkeeper_jwks_url.clone()));
    let decoder = jwks_decoder.clone();
    tokio::spawn(async move {
        decoder.refresh_keys_periodically().await;
    });

    let app = Router::new()
        .route(
            "/graphql",
            get(playground).post(axum::routing::post(graphql_handler)),
        )
        .route("/auth/check", get(check_handler).with_state(api_keys_app))
        .with_state(JwtDecoderState {
            decoder: jwks_decoder,
        })
        .layer(Extension(schema));

    println!("Starting graphql server on port {}", config.port);
    axum::Server::bind(&std::net::SocketAddr::from(([0, 0, 0, 0], config.port)))
        .serve(app.into_make_service())
        .await?;
    Ok(())
}

#[derive(Debug, Serialize)]
struct CheckResponse {
    sub: String,
}

async fn check_handler(
    State(app): State<ApiKeysApp>,
) -> Result<Json<CheckResponse>, ApplicationError> {
    let sub = app
        .lookup_authenticated_subject("ashoten".to_string())
        .await?;
    Ok(Json(CheckResponse { sub }))
}

pub async fn graphql_handler(
    schema: Extension<Schema<graphql::Query, graphql::Mutation, EmptySubscription>>,
    Claims(jwt_claims): Claims<OathkeeperClaims>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let req = req.into_inner();
    schema
        .execute(req.data(graphql::AuthSubject { id: jwt_claims.sub }))
        .await
        .into()
}

async fn playground() -> impl axum::response::IntoResponse {
    axum::response::Html(async_graphql::http::playground_source(
        async_graphql::http::GraphQLPlaygroundConfig::new("/graphql"),
    ))
}
