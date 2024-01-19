#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]
#![cfg_attr(feature = "fail-on-warnings", deny(clippy::all))]

mod app;
mod data_import;
mod novu;
mod primitives;
mod user_notification_settings;

pub mod cli;
pub mod graphql;
pub mod grpc;
