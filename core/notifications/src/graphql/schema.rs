use std::str::FromStr;

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
    async fn statefull_notifications(
        &self,
        _ctx: &Context<'_>,
    ) -> async_graphql::Result<Vec<StatefulNotification>> {
        // let app = ctx.data_unchecked::<NotificationsApp>();
        unimplemented!();
        // let notifications = app
        //     .in_app_notifications_for_user(
        //         GaloyUserId::from(self.id.0.clone()),
        //         only_unread.unwrap_or(false),
        //     )
        //     .await?;

        // Ok(notifications
        //     .into_iter()
        //     .map(InAppNotification::from)
        //     .collect())
    }
}

#[derive(SimpleObject)]
pub struct StatefullNotificationAcknowledgePayload {
    notification: StatefulNotification,
}

#[derive(InputObject)]
struct StatefullNotificationAcknowledgeInput {
    notification_id: ID,
}

pub struct Mutation;

#[Object]
impl Mutation {
    async fn statefull_notification_acknowledge(
        &self,
        ctx: &Context<'_>,
        input: StatefullNotificationAcknowledgeInput,
    ) -> async_graphql::Result<StatefullNotificationAcknowledgePayload> {
        let subject = ctx.data::<AuthSubject>()?;

        if !subject.can_write {
            return Err("Permission denied".into());
        }
        let app = ctx.data_unchecked::<NotificationsApp>();
        let notification_id = StatefulNotificationId::from_str(input.notification_id.0.as_str())?;
        let notification = app
            .acknowledge_notification(GaloyUserId::from(subject.id.clone()), notification_id)
            .await?;

        Ok(StatefullNotificationAcknowledgePayload {
            notification: StatefulNotification::from(notification),
        })
    }
}
