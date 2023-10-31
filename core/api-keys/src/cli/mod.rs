use anyhow::Context;
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
    println!("HELLO COMPLICATED WORLD");
    Ok(())
}
