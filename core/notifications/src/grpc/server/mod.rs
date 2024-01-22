mod convert;

#[allow(clippy::all)]
pub mod proto {
    tonic::include_proto!("services.notifications.v1");
}

use tonic::{transport::Server, Request, Response, Status};
use tracing::{grpc, instrument};

use self::proto::{notifications_service_server::NotificationsService, *};

use super::config::*;
use crate::{
    app::*,
    primitives::{GaloyUserId, UserNotificationCategory, UserNotificationChannel},
};

pub struct Notifications {
    app: NotificationsApp,
}

#[tonic::async_trait]
impl NotificationsService for Notifications {
    #[instrument(name = "notifications.should_send_notification", skip_all, err)]
    async fn should_send_notification(
        &self,
        request: Request<ShouldSendNotificationRequest>,
    ) -> Result<Response<ShouldSendNotificationResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let ShouldSendNotificationRequest {
            user_id,
            channel,
            category,
        } = request;
        let channel = proto::NotificationChannel::try_from(channel)
            .map(UserNotificationChannel::from)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;
        let category = proto::NotificationCategory::try_from(category)
            .map(UserNotificationCategory::from)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;
        let should_send = self
            .app
            .should_send_notification(user_id.clone().into(), channel, category)
            .await?;

        Ok(Response::new(ShouldSendNotificationResponse {
            user_id,
            should_send,
        }))
    }

    #[instrument(name = "notifications.user_enable_notification_channel", skip_all, err)]
    async fn user_enable_notification_channel(
        &self,
        request: Request<UserEnableNotificationChannelRequest>,
    ) -> Result<Response<UserEnableNotificationChannelResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let UserEnableNotificationChannelRequest { user_id, channel } = request;
        let channel = proto::NotificationChannel::try_from(channel)
            .map(UserNotificationChannel::from)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;
        let user_id = GaloyUserId::from(user_id);
        let notification_settings = self.app.enable_channel_on_user(user_id, channel).await?;

        Ok(Response::new(UserEnableNotificationChannelResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(
        name = "notifications.user_disable_notification_channel",
        skip_all,
        err
    )]
    async fn user_disable_notification_channel(
        &self,
        request: Request<UserDisableNotificationChannelRequest>,
    ) -> Result<Response<UserDisableNotificationChannelResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let UserDisableNotificationChannelRequest { user_id, channel } = request;
        let channel = proto::NotificationChannel::try_from(channel)
            .map(UserNotificationChannel::from)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;
        let user_id = GaloyUserId::from(user_id);
        let notification_settings = self.app.disable_channel_on_user(user_id, channel).await?;

        Ok(Response::new(UserDisableNotificationChannelResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(
        name = "notifications.user_enable_notification_category",
        skip_all,
        err
    )]
    async fn user_enable_notification_category(
        &self,
        request: Request<UserEnableNotificationCategoryRequest>,
    ) -> Result<Response<UserEnableNotificationCategoryResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let UserEnableNotificationCategoryRequest {
            user_id,
            channel,
            category,
        } = request;
        let channel = proto::NotificationChannel::try_from(channel)
            .map(UserNotificationChannel::from)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;
        let category = proto::NotificationCategory::try_from(category)
            .map(UserNotificationCategory::from)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;
        let user_id = GaloyUserId::from(user_id);
        let notification_settings = self
            .app
            .enable_category_on_user(user_id, channel, category)
            .await?;

        Ok(Response::new(UserEnableNotificationCategoryResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(
        name = "notifications.user_disable_notification_category",
        skip_all,
        err
    )]
    async fn user_disable_notification_category(
        &self,
        request: Request<UserDisableNotificationCategoryRequest>,
    ) -> Result<Response<UserDisableNotificationCategoryResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let UserDisableNotificationCategoryRequest {
            user_id,
            channel,
            category,
        } = request;
        let channel = proto::NotificationChannel::try_from(channel)
            .map(UserNotificationChannel::from)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;
        let category = proto::NotificationCategory::try_from(category)
            .map(UserNotificationCategory::from)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;
        let user_id = GaloyUserId::from(user_id);
        let notification_settings = self
            .app
            .disable_category_on_user(user_id, channel, category)
            .await?;

        Ok(Response::new(UserDisableNotificationCategoryResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(name = "notifications.user_notification_settings", skip_all, err)]
    async fn user_notification_settings(
        &self,
        request: Request<UserNotificationSettingsRequest>,
    ) -> Result<Response<UserNotificationSettingsResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let UserNotificationSettingsRequest { user_id } = request;
        let user_id = GaloyUserId::from(user_id);
        let notification_settings = self.app.notification_settings_for_user(user_id).await?;

        Ok(Response::new(UserNotificationSettingsResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    async fn notify_user_of_circles_event(
        &self,
        request: Request<NotifyUserOfCirclesEventRequest>,
    ) -> Result<Response<NotifyUserOfCirclesEventResponse>, Status> {
        // TODO: implement
        Err(Status::unimplemented("not implemented"))
    }
}

pub(crate) async fn start(
    server_config: GrpcServerConfig,
    app: NotificationsApp,
) -> Result<(), tonic::transport::Error> {
    use proto::notifications_service_server::NotificationsServiceServer;

    let notifications = Notifications { app };
    println!("Starting grpc server on port {}", server_config.port);
    let (mut health_reporter, health_service) = tonic_health::server::health_reporter();
    health_reporter
        .set_serving::<NotificationsServiceServer<Notifications>>()
        .await;
    Server::builder()
        .add_service(health_service)
        .add_service(NotificationsServiceServer::new(notifications))
        .serve(([0, 0, 0, 0], server_config.port).into())
        .await?;
    Ok(())
}
