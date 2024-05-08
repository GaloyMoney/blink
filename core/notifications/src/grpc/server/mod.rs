#![allow(clippy::blocks_in_conditions)]
mod convert;

#[allow(clippy::all)]
pub mod proto {
    tonic::include_proto!("services.notifications.v1");
}

use std::collections::{HashMap, HashSet};

use tonic::{transport::Server, Request, Response, Status};
use tracing::{grpc, instrument};

use self::proto::{notifications_service_server::NotificationsService, *};

use super::config::*;
use crate::{
    app::*,
    messages::LocalizedStatefulMessage,
    notification_event,
    primitives::{
        self, GaloyEmailAddress, GaloyLocale, GaloyUserId, PushDeviceToken,
        UserNotificationCategory, UserNotificationChannel,
    },
};

pub struct Notifications {
    app: NotificationsApp,
}

#[tonic::async_trait]
impl NotificationsService for Notifications {
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

    #[instrument(name = "notifications.update_email_address", skip_all, err)]
    async fn update_email_address(
        &self,
        request: Request<UpdateEmailAddressRequest>,
    ) -> Result<Response<UpdateEmailAddressResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let UpdateEmailAddressRequest {
            user_id,
            email_address,
        } = request;
        let user_id = GaloyUserId::from(user_id);
        let addr = GaloyEmailAddress::from(email_address);
        self.app.update_email_address(user_id, addr).await?;

        Ok(Response::new(UpdateEmailAddressResponse {}))
    }

    #[instrument(name = "notifications.remove_email_address", skip_all, err)]
    async fn remove_email_address(
        &self,
        request: Request<RemoveEmailAddressRequest>,
    ) -> Result<Response<RemoveEmailAddressResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let RemoveEmailAddressRequest { user_id } = request;
        let user_id = GaloyUserId::from(user_id);
        self.app.remove_email_address(user_id).await?;

        Ok(Response::new(RemoveEmailAddressResponse {}))
    }

    #[instrument(name = "notifications.handle_notification_event", skip_all, err)]
    async fn handle_notification_event(
        &self,
        request: Request<HandleNotificationEventRequest>,
    ) -> Result<Response<HandleNotificationEventResponse>, Status> {
        grpc::extract_tracing(&request);
        let request = request.into_inner();
        let HandleNotificationEventRequest { event } = request;

        match event {
            Some(proto::NotificationEvent {
                data:
                    Some(proto::notification_event::Data::CircleGrew(proto::CircleGrew {
                        user_id,
                        circle_type,
                        this_month_circle_size,
                        all_time_circle_size,
                    })),
            }) => {
                let circle_type = proto::CircleType::try_from(circle_type)
                    .map(primitives::CircleType::from)
                    .map_err(|e| Status::invalid_argument(e.to_string()))?;
                let user_id = GaloyUserId::from(user_id);

                self.app
                    .handle_single_user_event(
                        user_id,
                        notification_event::CircleGrew {
                            circle_type,
                            this_month_circle_size,
                            all_time_circle_size,
                        },
                    )
                    .await?;
            }
            Some(proto::NotificationEvent {
                data:
                    Some(proto::notification_event::Data::CircleThresholdReached(
                        proto::CircleThresholdReached {
                            user_id,
                            circle_type,
                            time_frame,
                            threshold,
                        },
                    )),
            }) => {
                let circle_type = proto::CircleType::try_from(circle_type)
                    .map(primitives::CircleType::from)
                    .map_err(|e| Status::invalid_argument(e.to_string()))?;
                let time_frame = proto::CircleTimeFrame::try_from(time_frame)
                    .map(primitives::CircleTimeFrame::from)
                    .map_err(|e| Status::invalid_argument(e.to_string()))?;
                let user_id = GaloyUserId::from(user_id);
                self.app
                    .handle_single_user_event(
                        user_id,
                        notification_event::CircleThresholdReached {
                            circle_type,
                            time_frame,
                            threshold,
                        },
                    )
                    .await?;
            }
            Some(proto::NotificationEvent {
                data:
                    Some(proto::notification_event::Data::IdentityVerificationApproved(
                        proto::IdentityVerificationApproved { user_id },
                    )),
            }) => {
                let user_id = GaloyUserId::from(user_id);
                self.app
                    .handle_single_user_event(
                        user_id,
                        notification_event::IdentityVerificationApproved {},
                    )
                    .await?;
            }
            Some(proto::NotificationEvent {
                data:
                    Some(proto::notification_event::Data::IdentityVerificationDeclined(
                        proto::IdentityVerificationDeclined {
                            user_id,
                            declined_reason,
                        },
                    )),
            }) => {
                let declined_reason = proto::DeclinedReason::try_from(declined_reason)
                    .map(notification_event::IdentityVerificationDeclinedReason::from)
                    .map_err(|e| Status::invalid_argument(e.to_string()))?;
                let user_id = GaloyUserId::from(user_id);
                self.app
                    .handle_single_user_event(
                        user_id,
                        notification_event::IdentityVerificationDeclined { declined_reason },
                    )
                    .await?;
            }
            Some(proto::NotificationEvent {
                data:
                    Some(proto::notification_event::Data::IdentityVerificationReviewStarted(
                        proto::IdentityVerificationReviewStarted { user_id },
                    )),
            }) => {
                let user_id = GaloyUserId::from(user_id);
                self.app
                    .handle_single_user_event(
                        user_id,
                        notification_event::IdentityVerificationReviewStarted {},
                    )
                    .await?;
            }
            Some(proto::NotificationEvent {
                data:
                    Some(proto::notification_event::Data::TransactionOccurred(
                        proto::TransactionOccurred {
                            user_id,
                            settlement_amount: Some(settlement_amount),
                            display_amount,
                            r#type,
                        },
                    )),
            }) => {
                let transaction_type = proto::TransactionType::try_from(r#type)
                    .map(notification_event::TransactionType::from)
                    .map_err(|e| Status::invalid_argument(e.to_string()))?;
                let user_id = GaloyUserId::from(user_id);
                self.app
                    .handle_transaction_occurred_event(
                        user_id,
                        notification_event::TransactionOccurred {
                            transaction_type,
                            settlement_amount: notification_event::TransactionAmount::try_from(
                                settlement_amount,
                            )?,
                            display_amount: display_amount
                                .map(notification_event::TransactionAmount::try_from)
                                .transpose()?,
                        },
                    )
                    .await?;
            }
            Some(proto::NotificationEvent {
                data:
                    Some(proto::notification_event::Data::Price(proto::PriceChanged {
                        price_of_one_bitcoin: Some(price),
                        direction,
                        price_change_percentage,
                    })),
            }) => {
                let direction = proto::PriceChangeDirection::try_from(direction)
                    .map(notification_event::PriceChangeDirection::from)
                    .map_err(|e| Status::invalid_argument(e.to_string()))?;
                self.app
                    .handle_price_changed_event(notification_event::PriceChanged {
                        price: notification_event::PriceOfOneBitcoin::try_from(price)?,
                        change_percent: notification_event::ChangePercentage::from(
                            price_change_percentage,
                        ),
                        direction,
                    })
                    .await?;
            }
            Some(proto::NotificationEvent {
                data:
                    Some(proto::notification_event::Data::MarketingNotificationTriggered(
                        proto::MarketingNotificationTriggered {
                            localized_content,
                            should_add_to_bulletin,
                            should_add_to_history,
                            should_send_push,
                            user_ids,
                            action,
                        },
                    )),
            }) => {
                let content: HashMap<GaloyLocale, LocalizedStatefulMessage> = localized_content
                    .into_iter()
                    .map(|(locale, localized_push_message)| {
                        let locale = primitives::GaloyLocale::from(locale);

                        (
                            locale.clone(),
                            LocalizedStatefulMessage {
                                title: localized_push_message.title,
                                body: localized_push_message.body,
                                locale: locale.clone(),
                            },
                        )
                    })
                    .collect();

                let user_ids: HashSet<GaloyUserId> =
                    user_ids.into_iter().map(GaloyUserId::from).collect();

                let default_content = content
                    .get(&GaloyLocale::default())
                    .cloned()
                    .ok_or_else(|| Status::invalid_argument("default content is required"))?;

                let action = action
                    .map(notification_event::Action::try_from)
                    .transpose()?;

                self.app
                    .handle_marketing_notification_triggered_event(
                        user_ids,
                        notification_event::MarketingNotificationTriggered {
                            content,
                            default_content,
                            should_add_to_bulletin,
                            should_add_to_history,
                            should_send_push,
                            action,
                        },
                    )
                    .await?;
            }
            _ => return Err(Status::invalid_argument("event is required")),
        }

        Ok(Response::new(HandleNotificationEventResponse {}))
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
