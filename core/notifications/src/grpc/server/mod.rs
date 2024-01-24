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
    primitives::{GaloyUserId, PushDeviceToken, UserNotificationCategory, UserNotificationChannel},
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

    #[instrument(name = "notifications.enable_notification_channel", skip_all, err)]
    async fn enable_notification_channel(
        &self,
        request: Request<EnableNotificationChannelRequest>,
    ) -> Result<Response<EnableNotificationChannelResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let EnableNotificationChannelRequest { user_id, channel } = request;
        let channel = proto::NotificationChannel::try_from(channel)
            .map(UserNotificationChannel::from)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;
        let user_id = GaloyUserId::from(user_id);
        let notification_settings = self.app.enable_channel_on_user(user_id, channel).await?;

        Ok(Response::new(EnableNotificationChannelResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(name = "notifications.disable_notification_channel", skip_all, err)]
    async fn disable_notification_channel(
        &self,
        request: Request<DisableNotificationChannelRequest>,
    ) -> Result<Response<DisableNotificationChannelResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let DisableNotificationChannelRequest { user_id, channel } = request;
        let channel = proto::NotificationChannel::try_from(channel)
            .map(UserNotificationChannel::from)
            .map_err(|e| Status::invalid_argument(e.to_string()))?;
        let user_id = GaloyUserId::from(user_id);
        let notification_settings = self.app.disable_channel_on_user(user_id, channel).await?;

        Ok(Response::new(DisableNotificationChannelResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(name = "notifications.enable_notification_category", skip_all, err)]
    async fn enable_notification_category(
        &self,
        request: Request<EnableNotificationCategoryRequest>,
    ) -> Result<Response<EnableNotificationCategoryResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let EnableNotificationCategoryRequest {
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

        Ok(Response::new(EnableNotificationCategoryResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(name = "notifications.disable_notification_category", skip_all, err)]
    async fn disable_notification_category(
        &self,
        request: Request<DisableNotificationCategoryRequest>,
    ) -> Result<Response<DisableNotificationCategoryResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let DisableNotificationCategoryRequest {
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

        Ok(Response::new(DisableNotificationCategoryResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(name = "notifications.notification_settings", skip_all, err)]
    async fn get_notification_settings(
        &self,
        request: Request<GetNotificationSettingsRequest>,
    ) -> Result<Response<GetNotificationSettingsResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let GetNotificationSettingsRequest { user_id } = request;
        let user_id = GaloyUserId::from(user_id);
        let notification_settings = self.app.notification_settings_for_user(user_id).await?;

        Ok(Response::new(GetNotificationSettingsResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(name = "notifications.update_user_locale", skip_all, err)]
    async fn update_user_locale(
        &self,
        request: Request<UpdateUserLocaleRequest>,
    ) -> Result<Response<UpdateUserLocaleResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let UpdateUserLocaleRequest { user_id, locale } = request;
        let user_id = GaloyUserId::from(user_id);
        let notification_settings = self.app.update_locale_on_user(user_id, locale).await?;

        Ok(Response::new(UpdateUserLocaleResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(name = "notifications.add_push_device_token", skip_all, err)]
    async fn add_push_device_token(
        &self,
        request: Request<AddPushDeviceTokenRequest>,
    ) -> Result<Response<AddPushDeviceTokenResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let AddPushDeviceTokenRequest {
            user_id,
            device_token,
        } = request;
        let user_id = GaloyUserId::from(user_id);
        let device_token = PushDeviceToken::from(device_token);
        let notification_settings = self
            .app
            .add_push_device_token(user_id, device_token)
            .await?;

        Ok(Response::new(AddPushDeviceTokenResponse {
            notification_settings: Some(notification_settings.into()),
        }))
    }

    #[instrument(name = "notifications.remove_push_device_token", skip_all, err)]
    async fn remove_push_device_token(
        &self,
        request: Request<RemovePushDeviceTokenRequest>,
    ) -> Result<Response<RemovePushDeviceTokenResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let RemovePushDeviceTokenRequest {
            user_id,
            device_token,
        } = request;
        let user_id = GaloyUserId::from(user_id);
        let device_token = PushDeviceToken::from(device_token);
        let notification_settings = self
            .app
            .remove_push_device_token(user_id, device_token)
            .await?;

        Ok(Response::new(RemovePushDeviceTokenResponse {
            notification_settings: Some(notification_settings.into()),
        }))
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
