#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]
#![cfg_attr(feature = "fail-on-warnings", deny(clippy::all))]

mod app;
mod circles_notifications;
mod data_import;
mod primitives;
mod user_notification_settings;

pub mod cli;
pub mod graphql;
pub mod grpc;
