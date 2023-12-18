mod config;
mod jwks;

use async_graphql::*;
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{extract::State, headers::HeaderMap, routing::get, Extension, Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::instrument;

use crate::{
    app::{ApiKeysApp, ApplicationError},
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

pub async fn run_server(config: ServerConfig, api_keys_app: ApiKeysApp) -> anyhow::Result<()> {
    let schema = graphql::schema(Some(api_keys_app.clone()));

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
        .route(
            "/auth/check",
            get(check_handler).with_state((config.api_key_auth_header, api_keys_app)),
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

#[derive(Debug, Serialize)]
struct CheckResponse {
    sub: String,
    scope: String,
}

#[instrument(
    name = "api-keys.server.check",
    skip_all,
    fields(key_id, sub, scope),
    err
)]
async fn check_handler(
    State((header, app)): State<(String, ApiKeysApp)>,
    headers: HeaderMap,
) -> Result<Json<CheckResponse>, ApplicationError> {
    tracing::extract_tracing(&headers);
    let key = headers.get(header).ok_or(ApplicationError::MissingApiKey)?;
    let (id, sub, scopes) = app.lookup_authenticated_subject(key.to_str()?).await?;
    let scope = scopes
        .into_iter()
        .map(|s| s.to_string())
        .collect::<Vec<String>>()
        .join(" ");
    let span = tracing::Span::current();
    span.record("key_id", &tracing::field::display(id));
    span.record("sub", &sub);
    span.record("scope", &scope);

    Ok(Json(CheckResponse { sub, scope }))
}

pub async fn graphql_handler(
    schema: Extension<Schema<graphql::Query, graphql::Mutation, EmptySubscription>>,
    Claims(jwt_claims): Claims<JwtClaims>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let req = req.into_inner();
    let read_only = crate::scope::is_read_only(&jwt_claims.scope);
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
