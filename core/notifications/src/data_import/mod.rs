use anyhow::*;
use futures::stream::TryStreamExt;

mod config;
mod mongodb;

pub use config::*;

pub async fn import_user_notification_settings(config: MongoImportConfig) -> anyhow::Result<()> {
    let client = mongodb::get_client(config).await?;
    let db = client.default_database().context("default database")?;
    let collections: Vec<_> = db.list_collections(None, None).await?.try_collect().await?;
    println!("collections: {:?}", collections);

    Ok(())
}
