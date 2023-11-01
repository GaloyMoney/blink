pub mod config;

use clap::{Parser, Subcommand};

use self::config::{Config, EnvOverride};
use crate::admin_client::AdminClient;

#[derive(Parser)]
#[clap(long_about = None)]
struct Cli {
    #[clap(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    Run {
        #[clap(env = "CLIENT_ID")]
        client_id: String,

        #[clap(env = "CLIENT_SECRET")]
        client_secret: String,
    },
}

pub async fn run() -> anyhow::Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Command::Run {
            client_id,
            client_secret,
        } => {
            let config = Config::from_env(EnvOverride {
                client_id,
                client_secret,
            })?;

            run_cmd(config).await?
        }
    }
    Ok(())
}

async fn run_cmd(config: Config) -> anyhow::Result<()> {
    println!("Running server");
    crate::graphql::run_server(config.server, AdminClient::new(config.admin, config.hydra)).await;
    Ok(())
}
