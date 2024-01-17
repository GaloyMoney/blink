mod config;
mod server;

use crate::app::*;

pub use config::*;
pub use server::*;

pub async fn run_server(config: GrpcServerConfig, app: NotificationsApp) -> anyhow::Result<()> {
    server::start(config, app).await?;
    Ok(())
}
