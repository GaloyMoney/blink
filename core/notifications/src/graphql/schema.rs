use std::str::FromStr;

use async_graphql::{types::connection::*, *};

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
    async fn stateful_notifications(
        &self,
        ctx: &Context<'_>,
        first: i32,
        after: Option<String>,
    ) -> async_graphql::Result<
        Connection<
            StatefulNotificationsByCreatedAtCursor,
            StatefulNotification,
            EmptyFields,
            EmptyFields,
        >,
    > {
        let app = ctx.data_unchecked::<NotificationsApp>();
        let user_id = GaloyUserId::from(self.id.0.clone());
        query(
            after,
            None,
            Some(first),
            None,
            |after, _, first, _| async move {
                let first = first.expect("First always exists");
                let (notifications, has_next) = app
                    .list_stateful_notifications(
                        user_id,
                        first,
                        after.map(|after: StatefulNotificationsByCreatedAtCursor| after.id),
                    )
                    .await?;
                let mut connection = Connection::new(false, has_next);
                connection
                    .edges
                    .extend(notifications.into_iter().map(|notification| {
                        let cursor = StatefulNotificationsByCreatedAtCursor::from(notification.id);
                        Edge::new(cursor, StatefulNotification::from(notification))
                    }));
                Ok::<_, async_graphql::Error>(connection)
            },
        )
        .await
    }

    async fn language(&self, ctx: &Context<'_>) -> async_graphql::Result<Language> {
        let app = ctx.data_unchecked::<NotificationsApp>();
        let user_id = GaloyUserId::from(self.id.0.clone());
        Ok::<_, async_graphql::Error>(
            app.notification_settings_for_user(user_id)
                .await?
                .locale()
                .map_or(Language::default(), Language::from),
        )
    }
}

#[derive(SimpleObject)]
pub struct StatefulNotificationAcknowledgePayload {
    notification: StatefulNotification,
}

#[derive(InputObject)]
struct StatefulNotificationAcknowledgeInput {
    notification_id: ID,
}

pub struct Mutation;

#[Object]
impl Mutation {
    async fn stateful_notification_acknowledge(
        &self,
        ctx: &Context<'_>,
        input: StatefulNotificationAcknowledgeInput,
    ) -> async_graphql::Result<StatefulNotificationAcknowledgePayload> {
        let subject = ctx.data::<AuthSubject>()?;

        if !subject.can_write {
            return Err("Permission denied".into());
        }
        let app = ctx.data_unchecked::<NotificationsApp>();
        let notification_id = StatefulNotificationId::from_str(input.notification_id.0.as_str())?;
        let notification = app
            .acknowledge_notification(GaloyUserId::from(subject.id.clone()), notification_id)
            .await?;

        Ok(StatefulNotificationAcknowledgePayload {
            notification: StatefulNotification::from(notification),
        })
    }
}
