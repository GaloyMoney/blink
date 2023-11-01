pub mod config;

use std::path::PathBuf;

use clap::{Parser, Subcommand};

use self::config::{Config, EnvOverride};

#[derive(Parser)]
#[clap(long_about = None)]
struct Cli {
    /// Sets a custom config file
    #[clap(
        short,
        long,
        env = "API_KEYS_CONFIG",
        default_value = "api_keys.yml",
        value_name = "FILE"
    )]
    config: PathBuf,

    #[clap(env = "API_KEYS_CLIENT_ID")]
    client_id: String,

    #[clap(env = "API_KEYS_CLIENT_SECRET")]
    client_secret: String,

    #[clap(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    Run {},
}
pub async fn run() -> anyhow::Result<()> {
    let cli = Cli::parse();

    let config = Config::from_path(
        cli.config,
        EnvOverride {
            client_id: cli.client_id,
            client_secret: cli.client_secret,
        },
    )?;

    match cli.command {
        Command::Run {} => run_cmd(config).await?,
    }
    Ok(())
}

async fn run_cmd(config: Config) -> anyhow::Result<()> {
    println!("Running server");
    crate::graphql::run_server(config).await;
    Ok(())
}
