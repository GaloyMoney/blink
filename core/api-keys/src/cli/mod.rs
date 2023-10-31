use clap::{Parser, Subcommand};

#[derive(Parser)]
#[clap(long_about = None)]
struct Cli {
    #[clap(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    Run {},
}
pub async fn run() -> anyhow::Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Command::Run {} => run_cmd().await?,
    }
    Ok(())
}

async fn run_cmd() -> anyhow::Result<()> {
    println!("Running server");
    crate::graphql::run_server().await;
    Ok(())
}
