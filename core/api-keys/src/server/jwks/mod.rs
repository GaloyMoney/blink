// This module was created by splitting the code from the
// [`axum-jwt-auth`](https://github.com/cmackenzie1/axum-jwt-auth) crate

mod error;

use axum::{async_trait, extract::FromRef, http::request::Parts, RequestPartsExt};
use axum_extra::{
    headers::authorization::{Authorization, Bearer},
    TypedHeader,
};
use jsonwebtoken::{jwk::JwkSet, Algorithm, DecodingKey, TokenData, Validation};
use serde::{de::DeserializeOwned, Deserialize};

use std::sync::{Arc, RwLock};

pub use error::*;

#[derive(Debug, Deserialize)]
pub struct Claims<T>(pub T);

#[derive(Clone, FromRef)]
pub struct JwtDecoderState {
    pub decoder: Arc<RemoteJwksDecoder>,
}

#[async_trait]
impl<S, T> axum::extract::FromRequestParts<S> for Claims<T>
where
    JwtDecoderState: FromRef<S>,
    S: Send + Sync,
    T: DeserializeOwned,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // `TypedHeader<Authorization<Bearer>>` extracts the auth token
        let auth: TypedHeader<Authorization<Bearer>> = parts
            .extract()
            .await
            .map_err(|_| Self::Rejection::MissingToken)?;

        let state = JwtDecoderState::from_ref(state);
        // `JwtDecoder::decode` decodes the token
        let token_data = state.decoder.decode(auth.token()).map_err(|e| match e {
            JwksError::Jwt(e) => match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => Self::Rejection::ExpiredToken,
                jsonwebtoken::errors::ErrorKind::InvalidSignature => {
                    Self::Rejection::InvalidSignature
                }
                _ => Self::Rejection::InvalidToken,
            },
            _ => Self::Rejection::InternalError,
        })?;

        Ok(token_data.claims)
    }
}

/// A trait for decoding JWT tokens.
pub trait JwtDecoder<T>
where
    T: for<'de> DeserializeOwned,
{
    fn decode(&self, token: &str) -> Result<TokenData<T>, JwksError>;
}

/// Remote JWKS decoder.
/// It fetches the JWKS from the given URL and caches it for the given duration.
/// It uses the cached JWKS to decode the JWT tokens.
pub struct RemoteJwksDecoder {
    jwks_url: String,
    cache_duration: std::time::Duration,
    keys_cache: RwLock<Vec<(Option<String>, DecodingKey)>>,
    validation: Validation,
    client: reqwest::Client,
    retry_count: usize,
    backoff: std::time::Duration,
}

impl RemoteJwksDecoder {
    pub fn new(jwks_url: String) -> Self {
        Self {
            jwks_url,
            cache_duration: std::time::Duration::from_secs(30 * 60),
            keys_cache: RwLock::new(Vec::new()),
            validation: Validation::new(Algorithm::RS256),
            client: reqwest::Client::new(),
            retry_count: 10,
            backoff: std::time::Duration::from_secs(2),
        }
    }

    async fn refresh_keys(&self) -> Result<(), JwksError> {
        let max_attempts = self.retry_count;
        let mut attempt = 0;
        let mut err = None;

        while attempt < max_attempts {
            match self.refresh_keys_once().await {
                Ok(_) => return Ok(()),
                Err(e) => {
                    err = Some(e);
                    attempt += 1;
                    tokio::time::sleep(self.backoff).await;
                }
            }
        }

        Err(err.unwrap())
    }

    async fn refresh_keys_once(&self) -> Result<(), JwksError> {
        let jwks = self
            .client
            .get(&self.jwks_url)
            .send()
            .await?
            .json::<JwkSet>()
            .await?;

        let mut jwks_cache = self.keys_cache.write().unwrap();
        *jwks_cache = jwks
            .keys
            .iter()
            .flat_map(|jwk| -> Result<(Option<String>, DecodingKey), JwksError> {
                let key_id = jwk.common.key_id.to_owned();
                let key = DecodingKey::from_jwk(jwk).map_err(JwksError::Jwt)?;

                Ok((key_id, key))
            })
            .collect();

        Ok(())
    }

    /// Refreshes the JWKS cache periodically.
    /// It runs in a loop and never returns, so it should be run in a separate tokio task
    /// using [`tokio::spawn`]. If the JWKS refresh fails after multiple attempts,
    /// it logs the error and continues. The decoder will use the stale keys until the next refresh
    /// succeeds or the universe ends, whichever comes first.
    pub async fn refresh_keys_periodically(&self) {
        loop {
            let mut err = None;
            match self.refresh_keys().await {
                Ok(_) => {
                    err = None;
                }
                Err(e) => {
                    eprintln!(
                        "Failed to refresh JWKS after {} attempts: {:?}",
                        self.retry_count, err
                    );
                    err = Some(e);
                }
            }
            if err.is_some() {
                continue;
            }
            tokio::time::sleep(self.cache_duration).await;
        }
    }
}

impl<T> JwtDecoder<T> for RemoteJwksDecoder
where
    T: for<'de> DeserializeOwned,
{
    fn decode(&self, token: &str) -> Result<TokenData<T>, JwksError> {
        let header = jsonwebtoken::decode_header(token)?;
        let target_kid = header.kid;

        let jwks_cache = self.keys_cache.read().unwrap();

        // Try to find the key in the cache by kid
        let jwk = jwks_cache.iter().find(|(kid, _)| kid == &target_kid);
        if let Some((_, key)) = jwk {
            return Ok(jsonwebtoken::decode::<T>(token, key, &self.validation)?);
        }

        // Otherwise, try all the keys in the cache, returning the first one that works
        // If none of them work, return the error from the last one
        let mut err = JwksError::NoKeyAvailable;
        for (_, key) in jwks_cache.iter() {
            match jsonwebtoken::decode::<T>(token, key, &self.validation) {
                Ok(token_data) => return Ok(token_data),
                Err(e) => err = e.into(),
            }
        }

        Err(err)
    }
}
