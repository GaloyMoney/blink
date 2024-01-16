use anyhow::*;
use futures::stream::StreamExt;
use serde::Deserialize;

mod config;
mod mongodb;

use crate::{app::NotificationsApp, primitives::*};
pub use config::*;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MongoChannelSettings {
    enabled: bool,
    disabled_categories: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct MongoNotificationSettings {
    push: MongoChannelSettings,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MongoAccount {
    kratos_user_id: String,
    notification_settings: MongoNotificationSettings,
}

pub async fn import_user_notification_settings(
    app: NotificationsApp,
    config: MongoImportConfig,
) -> anyhow::Result<()> {
    let client = mongodb::get_client(config).await?;
    let db = client.default_database().context("default database")?;
    let accounts = db.collection::<MongoAccount>("accounts");
    let mut cursor = accounts.find(None, None).await?;
    let mut total_accounts = 0;
    while let Some(core::result::Result::Ok(account)) = cursor.next().await {
        let user_id = GaloyUserId::from(account.kratos_user_id);
        for category in account.notification_settings.push.disabled_categories {
            let category = match category.as_ref() {
                "Circles" | "circles" => UserNotificationCategory::Circles,
                "Payments" | "payments" => UserNotificationCategory::Payments,
                _ => continue,
            };
            app.disable_category_on_user(user_id.clone(), UserNotificationChannel::Push, category)
                .await?;
        }
        if !account.notification_settings.push.enabled {
            app.disable_channel_on_user(user_id, UserNotificationChannel::Push)
                .await?;
        }
        total_accounts += 1;
        if total_accounts % 100 == 0 {
            println!("{total_accounts} accounts sycned");
        }
    }
    println!("SYNCING FINISHED: {total_accounts} accounts sycned");

    Ok(())
}
