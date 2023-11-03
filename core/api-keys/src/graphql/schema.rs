use async_graphql::*;
use chrono::{DateTime, Utc};

use crate::{app::ApiKeysApp, identity::IdentityApiKeyId};

pub struct AuthSubject {
    pub id: String,
}

pub struct Query;

#[Object]
impl Query {
    #[graphql(entity)]
    async fn me(&self, id: ID) -> Option<User> {
        Some(User { id })
    }
}

#[derive(SimpleObject)]
pub(super) struct ApiKey {
    pub id: ID,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub revoked: bool,
    pub expired: bool,
    pub last_used_at: Option<DateTime<Utc>>,
    pub expires_at: DateTime<Utc>,
}

#[derive(SimpleObject)]
#[graphql(extends)]
#[graphql(complex)]
struct User {
    #[graphql(external)]
    id: ID,
}

#[ComplexObject]
impl User {
    async fn api_keys(&self, ctx: &Context<'_>) -> Result<Vec<ApiKey>> {
        let app = ctx.data_unchecked::<ApiKeysApp>();
        let subject = ctx.data::<AuthSubject>()?;

        let identity_api_keys = app.list_api_keys_for_subject(&subject.id).await?;
        let api_keys = identity_api_keys.into_iter().map(ApiKey::from).collect();

        Ok(api_keys)
    }
}

#[derive(SimpleObject)]
pub(super) struct ApiKeyCreatePayload {
    pub api_key: ApiKey,
    pub api_key_secret: String,
}

pub struct Mutation;

#[derive(InputObject)]
struct ApiKeyCreateInput {
    name: String,
    expire_in_days: Option<u16>,
}

#[derive(InputObject)]
struct ApiKeyRevokeInput {
    id: ID,
}

#[Object]
impl Mutation {
    async fn api_key_create(
        &self,
        ctx: &Context<'_>,
        input: ApiKeyCreateInput,
    ) -> async_graphql::Result<ApiKeyCreatePayload> {
        let app = ctx.data_unchecked::<ApiKeysApp>();
        let subject = ctx.data::<AuthSubject>()?;
        let key = app
            .create_api_key_for_subject(&subject.id, input.name)
            .await?;
        Ok(ApiKeyCreatePayload::from(key))
    }

    async fn api_key_revoke(
        &self,
        ctx: &Context<'_>,
        input: ApiKeyRevokeInput,
    ) -> async_graphql::Result<bool> {
        let app = ctx.data_unchecked::<ApiKeysApp>();
        let api_key_id = input.id.parse::<IdentityApiKeyId>()?;
        let subject = ctx.data::<AuthSubject>()?;
        app.revoke_api_key_for_subject(&subject.id, api_key_id)
            .await?;
        Ok(true)
    }
}
