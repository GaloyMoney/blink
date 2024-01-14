mod convert;

#[allow(clippy::all)]
pub mod proto {
    tonic::include_proto!("services.notifications.v1");
}

use tonic::{transport::Server, Request, Response, Status};

use self::proto::{notifications_service_server::NotificationsService, *};

use super::config::*;
use crate::app::{ApplicationError, *};

pub struct Notifications {
    app: NotificationsApp,
}

#[tonic::async_trait]
impl NotificationsService for Notifications {
    async fn should_send_notification(
        &self,
        request: Request<ShouldSendNotificationRequest>,
    ) -> Result<Response<ShouldSendNotificationResponse>, Status> {
        let request = request.into_inner();
        let ShouldSendNotificationRequest {
            user_id,
            channel,
            category,
        } = request;

        let should_send = self
            .app
            .should_send_notification(user_id.clone().into(), channel.into(), category.into())
            .await?;

        Ok(Response::new(ShouldSendNotificationResponse {
            user_id,
            should_send,
        }))
    }
}

pub(crate) async fn start(
    server_config: GrpcServerConfig,
    app: NotificationsApp,
) -> Result<(), ApplicationError> {
    use proto::notifications_service_server::NotificationsServiceServer;

    let notifications = Notifications { app };
    println!("Starting grpc server on port {}", server_config.listen_port);
    let (mut health_reporter, health_service) = tonic_health::server::health_reporter();
    health_reporter
        .set_serving::<NotificationsServiceServer<Notifications>>()
        .await;
    Server::builder()
        .add_service(health_service)
        .add_service(NotificationsServiceServer::new(notifications))
        .serve(([0, 0, 0, 0], server_config.listen_port).into())
        .await?;
    Ok(())
}
