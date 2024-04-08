use async_graphql::*;

use super::types::*;
use crate::{app::NotificationsApp, primitives::*};

pub struct AuthSubject {
    pub id: String,
    pub can_write: bool,
}

pub struct Query;

#[Object]
impl Query {
    #[graphql(entity)]
    async fn user(&self, id: ID) -> Option<User> {
        Some(User { id })
    }
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
    async fn notification_settings(
        &self,
        ctx: &Context<'_>,
    ) -> async_graphql::Result<UserNotificationSettings> {
        let app = ctx.data_unchecked::<NotificationsApp>();

        let settings = app
            .notification_settings_for_user(GaloyUserId::from(self.id.0.clone()))
            .await?;

        Ok(UserNotificationSettings::from(settings))
    }

    async fn in_app_notifications(
        &self,
        ctx: &Context<'_>,
        only_unread: Option<bool>,
    ) -> async_graphql::Result<Vec<InAppNotification>> {
        let app = ctx.data_unchecked::<NotificationsApp>();

        let notifications = app
            .in_app_notifications_for_user(
                GaloyUserId::from(self.id.0.clone()),
                only_unread.unwrap_or(false),
            )
            .await?;

        Ok(notifications
            .into_iter()
            .map(InAppNotification::from)
            .collect())
    }
}

#[derive(SimpleObject)]
pub struct UserUpdateNotificationSettingsPayload {
    notification_settings: UserNotificationSettings,
}

#[derive(InputObject)]
struct UserDisableNotificationChannelInput {
    channel: UserNotificationChannel,
}

#[derive(InputObject)]
struct UserEnableNotificationChannelInput {
    channel: UserNotificationChannel,
}

#[derive(InputObject)]
struct UserEnableNotificationCategoryInput {
    channel: UserNotificationChannel,
    category: UserNotificationCategory,
}

#[derive(InputObject)]
struct UserDisableNotificationCategoryInput {
    channel: UserNotificationChannel,
    category: UserNotificationCategory,
}

pub struct Mutation;

#[Object]
impl Mutation {
    async fn user_disable_notification_channel(
        &self,
        ctx: &Context<'_>,
        input: UserDisableNotificationChannelInput,
    ) -> async_graphql::Result<UserUpdateNotificationSettingsPayload> {
        let subject = ctx.data::<AuthSubject>()?;
        if !subject.can_write {
            return Err("Permission denied".into());
        }
        let app = ctx.data_unchecked::<NotificationsApp>();
        let settings = app
            .disable_channel_on_user(GaloyUserId::from(subject.id.clone()), input.channel)
            .await?;
        Ok(UserUpdateNotificationSettingsPayload {
            notification_settings: UserNotificationSettings::from(settings),
        })
    }

    async fn user_enable_notification_channel(
        &self,
        ctx: &Context<'_>,
        input: UserEnableNotificationChannelInput,
    ) -> async_graphql::Result<UserUpdateNotificationSettingsPayload> {
        let subject = ctx.data::<AuthSubject>()?;
        if !subject.can_write {
            return Err("Permission denied".into());
        }
        let app = ctx.data_unchecked::<NotificationsApp>();

        let settings = app
            .enable_channel_on_user(GaloyUserId::from(subject.id.clone()), input.channel)
            .await?;

        Ok(UserUpdateNotificationSettingsPayload {
            notification_settings: UserNotificationSettings::from(settings),
        })
    }

    async fn user_disable_notification_category(
        &self,
        ctx: &Context<'_>,
        input: UserDisableNotificationCategoryInput,
    ) -> async_graphql::Result<UserUpdateNotificationSettingsPayload> {
        let subject = ctx.data::<AuthSubject>()?;
        if !subject.can_write {
            return Err("Permission denied".into());
        }
        let app = ctx.data_unchecked::<NotificationsApp>();

        let settings = app
            .disable_category_on_user(
                GaloyUserId::from(subject.id.clone()),
                input.channel,
                input.category,
            )
            .await?;

        Ok(UserUpdateNotificationSettingsPayload {
            notification_settings: UserNotificationSettings::from(settings),
        })
    }

    async fn user_enable_notification_category(
        &self,
        ctx: &Context<'_>,
        input: UserEnableNotificationCategoryInput,
    ) -> async_graphql::Result<UserUpdateNotificationSettingsPayload> {
        let subject = ctx.data::<AuthSubject>()?;
        if !subject.can_write {
            return Err("Permission denied".into());
        }
        let app = ctx.data_unchecked::<NotificationsApp>();

        let settings = app
            .enable_category_on_user(
                GaloyUserId::from(subject.id.clone()),
                input.channel,
                input.category,
            )
            .await?;

        Ok(UserUpdateNotificationSettingsPayload {
            notification_settings: UserNotificationSettings::from(settings),
        })
    }
}
