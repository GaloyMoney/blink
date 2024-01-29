#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]
#![cfg_attr(feature = "fail-on-warnings", deny(clippy::all))]

mod app;
mod data_import;

pub mod cli;
pub mod executor;
pub mod graphql;
pub mod grpc;
pub mod notification_event;
pub mod primitives;
pub mod user_notification_settings;
