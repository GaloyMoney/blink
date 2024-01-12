#![cfg_attr(feature = "fail-on-warnings", deny(warnings))]
#![cfg_attr(feature = "fail-on-warnings", deny(clippy::all))]

mod user_notification_settings;
mod app;
mod data_import;
mod primitives;

pub mod cli;
pub mod graphql;
