use async_graphql::*;

use super::types::*;
use crate::{app::NotificationsApp, primitives::*};

pub struct AuthSubject {
    pub id: String,
    pub read_only: bool,
}

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
#[ComplexObject]
impl ConsumerAccount {}

#[derive(SimpleObject)]
pub struct AccountUpdateNotificationSettingsPayloadAlt {
    notification_settings: NotificationSettingsAlt,
}

#[derive(InputObject)]
struct AccountDisableNotificationChannelInputAlt {
    channel: NotificationChannel,
}

pub struct Mutation;

#[Object]
impl Mutation {
    async fn account_disable_notification_channel_alt(
        &self,
        ctx: &Context<'_>,
        input: AccountDisableNotificationChannelInputAlt,
    ) -> async_graphql::Result<AccountUpdateNotificationSettingsPayloadAlt> {
        let subject = ctx.data::<AuthSubject>()?;
        if subject.read_only {
            return Err("Permission denied".into());
        }
        let app = ctx.data_unchecked::<NotificationsApp>();
        let res: NotificationSettingsAlt = app
            .disable_channel_on_account(GaloyAccountId::from(subject.id.clone()), input.channel)
            .await?;
        Ok(AccountUpdateNotificationSettingsPayloadAlt {
            notification_settings: res,
        })
    }
}
