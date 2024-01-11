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
impl ConsumerAccount {
    async fn notification_settings_alt(
        &self,
        ctx: &Context<'_>,
    ) -> async_graphql::Result<NotificationSettingsAlt> {
        let app = ctx.data_unchecked::<NotificationsApp>();
        
        // TODO: we should be using account_id but the mutations currently use subject.id
        // let account_id = GaloyAccountId::from(self.id.0.clone());

        let subject = ctx.data::<AuthSubject>()?;

        let settings = app
            .notification_settings_for_account(GaloyAccountId::from(subject.id.clone()))
            .await?;

        Ok(NotificationSettingsAlt::from(settings))
    }
}

#[derive(SimpleObject)]
pub struct AccountUpdateNotificationSettingsPayloadAlt {
    notification_settings: NotificationSettingsAlt,
}

#[derive(InputObject)]
struct AccountDisableNotificationChannelInputAlt {
    channel: NotificationChannel,
}

#[derive(InputObject)]
struct AccountEnableNotificationChannelInputAlt {
    channel: NotificationChannel,
}

#[derive(InputObject)]
struct AccountEnableNotificationCategoryInputAlt {
    channel: NotificationChannel,
    category: NotificationCategory,
}

#[derive(InputObject)]
struct AccountDisableNotificationCategoryInputAlt {
    channel: NotificationChannel,
    category: NotificationCategory,
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
        let settings = app
            .disable_channel_on_account(GaloyAccountId::from(subject.id.clone()), input.channel)
            .await?;
        Ok(AccountUpdateNotificationSettingsPayloadAlt {
            notification_settings: NotificationSettingsAlt::from(settings),
        })
    }

    async fn account_enable_notification_channel_alt(
        &self,
        ctx: &Context<'_>,
        input: AccountEnableNotificationChannelInputAlt,
    ) -> async_graphql::Result<AccountUpdateNotificationSettingsPayloadAlt> {
        let subject = ctx.data::<AuthSubject>()?;
        if subject.read_only {
            return Err("Permission denied".into());
        }
        let app = ctx.data_unchecked::<NotificationsApp>();

        let settings = app
            .enable_channel_on_account(GaloyAccountId::from(subject.id.clone()), input.channel)
            .await?;

        Ok(AccountUpdateNotificationSettingsPayloadAlt {
            notification_settings: NotificationSettingsAlt::from(settings),
        })
    }

    async fn account_disable_notification_category_alt(
        &self,
        ctx: &Context<'_>,
        input: AccountDisableNotificationCategoryInputAlt,
    ) -> async_graphql::Result<AccountUpdateNotificationSettingsPayloadAlt> {
        let subject = ctx.data::<AuthSubject>()?;
        if subject.read_only {
            return Err("Permission denied".into());
        }
        let app = ctx.data_unchecked::<NotificationsApp>();

        let settings = app
            .disable_category_on_account(
                GaloyAccountId::from(subject.id.clone()),
                input.channel,
                input.category,
            )
            .await?;

        Ok(AccountUpdateNotificationSettingsPayloadAlt {
            notification_settings: NotificationSettingsAlt::from(settings),
        })
    }

    async fn account_enable_notification_category_alt(
        &self,
        ctx: &Context<'_>,
        input: AccountEnableNotificationCategoryInputAlt,
    ) -> async_graphql::Result<AccountUpdateNotificationSettingsPayloadAlt> {
        let subject = ctx.data::<AuthSubject>()?;
        if subject.read_only {
            return Err("Permission denied".into());
        }
        let app = ctx.data_unchecked::<NotificationsApp>();

        let settings = app
            .enable_category_on_account(
                GaloyAccountId::from(subject.id.clone()),
                input.channel,
                input.category,
            )
            .await?;

        Ok(AccountUpdateNotificationSettingsPayloadAlt {
            notification_settings: NotificationSettingsAlt::from(settings),
        })
    }
    
}
