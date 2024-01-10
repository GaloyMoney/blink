use async_graphql::*;

use crate::app::NotificationsApp;

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

#[derive(SimpleObject)]
pub struct AccountUpdateNotificationSettingsPayloadAlt {
    dummy: String,
}

#[derive(SimpleObject)]
pub struct NotificationSettingsAlt {
    hello: String,
}

#[ComplexObject]
impl ConsumerAccount {
    async fn notification_settings_alt(&self) -> NotificationSettingsAlt {
        unimplemented!()
    }
}

#[derive(InputObject)]
struct AccountDisableNotificationChannelInputAlt {
    channel: String,
}

pub struct Mutation;

#[Object]
impl Mutation {
    async fn account_disable_notification_channel_alt(
        &self,
        ctx: &Context<'_>,
        input: AccountDisableNotificationChannelInputAlt,
    ) -> async_graphql::Result<AccountUpdateNotificationSettingsPayloadAlt> {
        let app = ctx.data_unchecked::<NotificationsApp>();
        let subject = ctx.data::<AuthSubject>()?;
        if subject.read_only {
            return Err("Permission denied".into());
        }
        unimplemented!()
    }
}
