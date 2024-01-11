mod config;
mod jwks;

use async_graphql::*;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{routing::get, Extension, Router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;


use crate::{
    app::{NotificationsApp},
    graphql,
};

pub use config::*;
use jwks::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct JwtClaims {
    sub: String,
    exp: u64,
    #[serde(default)]
    scope: String,
}

pub async fn run_server(
    config: ServerConfig,
    notifications_app: NotificationsApp,
) -> anyhow::Result<()> {
    let schema = graphql::schema(Some(notifications_app.clone()));

    let jwks_decoder = Arc::new(RemoteJwksDecoder::new(config.jwks_url.clone()));
    let decoder = jwks_decoder.clone();
    tokio::spawn(async move {
        decoder.refresh_keys_periodically().await;
    });

    let app = Router::new()
        .route(
            "/graphql",
            get(playground).post(axum::routing::post(graphql_handler)),
        )
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

pub async fn graphql_handler(
    schema: Extension<Schema<graphql::Query, graphql::Mutation, EmptySubscription>>,
    Claims(jwt_claims): Claims<JwtClaims>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let req = req.into_inner();
    let read_only = is_read_only(&jwt_claims.scope);
    schema
        .execute(req.data(graphql::AuthSubject {
            id: jwt_claims.sub,
            read_only,
        }))
        .await
        .into()
}

async fn playground() -> impl axum::response::IntoResponse {
    axum::response::Html(async_graphql::http::playground_source(
        async_graphql::http::GraphQLPlaygroundConfig::new("/graphql"),
    ))
}
pub const READ_SCOPE: &str = "read";
pub const WRITE_SCOPE: &str = "write";

pub fn read_only_scope() -> String {
    READ_SCOPE.to_string()
}

pub fn read_write_scope() -> String {
    format!("{READ_SCOPE} {WRITE_SCOPE}")
}

pub fn is_read_only(scope: &String) -> bool {
    !(scope.as_str().split(' ').any(|s| s == WRITE_SCOPE) || scope.is_empty())
}
