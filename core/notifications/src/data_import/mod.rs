use anyhow::*;
use futures::stream::StreamExt;
use serde::Deserialize;

mod config;
mod mongodb;

use crate::{app::NotificationsApp, primitives::*};
pub use config::*;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MongoUser {
    #[serde(default)]
    user_id: Option<String>,
    #[serde(default)]
    device_tokens: Vec<String>,
}

pub async fn import_user_notification_settings(
    app: NotificationsApp,
    config: MongoImportConfig,
) -> anyhow::Result<()> {
    let client = mongodb::get_client(config).await?;
    let db = client.default_database().context("default database")?;
    let users = db.collection::<MongoUser>("users");
    let mut cursor = users.find(None, None).await?;
    let mut total_users = 0;
    while let Some(maybe_user) = cursor.next().await {
        let user = match maybe_user {
            Err(e) => {
                println!("Error deserializing user: {:?}", e);
                continue;
            }
            core::result::Result::Ok(user) => user,
        };
        if let Some(user_id) = user.user_id {
            if !user.device_tokens.is_empty() {
                let user_id = GaloyUserId::from(user_id);
                for device_token in user.device_tokens {
                    app.add_push_device_token(user_id.clone(), PushDeviceToken::from(device_token))
                        .await?;
                }
            }
        }

        total_users += 1;
        if total_users % 100 == 0 {
            println!("{total_users} users synced");
        }
    }
    println!("SYNCING FINISHED: {total_users} users sycned");

    Ok(())
}
