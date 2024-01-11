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
#[ComplexObject]
impl ConsumerAccount {}

#[derive(SimpleObject)]
pub struct AccountUpdateNotificationSettingsPayloadAlt {
    notification_settings: NotificationSettingsAlt,
}

#[derive(SimpleObject)]
pub struct NotificationSettingsAlt {
    push: NotificationChannelSettingsAlt,
}

#[derive(SimpleObject)]
pub struct NotificationChannelSettingsAlt {
    enabled: bool,
    disabled_categories: Vec<String>,
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
        _input: AccountDisableNotificationChannelInputAlt,
    ) -> async_graphql::Result<AccountUpdateNotificationSettingsPayloadAlt> {
        let _app = ctx.data_unchecked::<NotificationsApp>();
        let subject = ctx.data::<AuthSubject>()?;
        if subject.read_only {
            return Err("Permission denied".into());
        }
        Ok(AccountUpdateNotificationSettingsPayloadAlt {
            notification_settings: NotificationSettingsAlt {
                push: NotificationChannelSettingsAlt {
                    enabled: false,
                    disabled_categories: vec![],
                },
            },
        })
    }
}
