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
    #[serde(default = "bool_true")]
    enabled: bool,
    #[serde(default)]
    disabled_categories: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct MongoNotificationSettings {
    #[serde(default)]
    push: Option<MongoChannelSettings>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MongoAccount {
    #[serde(default)]
    kratos_user_id: Option<String>,
    #[serde(default)]
    notification_settings: Option<MongoNotificationSettings>,
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
    while let Some(maybe_account) = cursor.next().await {
        let account = match maybe_account {
            Err(e) => {
                println!("Error deserializing account: {:?}", e);
                continue;
            }
            core::result::Result::Ok(account) => account,
        };
        if let (Some(kratos_user_id), Some(notification_settings)) =
            (account.kratos_user_id, account.notification_settings)
        {
            let user_id = GaloyUserId::from(kratos_user_id);
            if let Some(push) = notification_settings.push {
                for category in push.disabled_categories {
                    let category = match category.as_ref() {
                        "Circles" | "circles" => UserNotificationCategory::Circles,
                        "Payments" | "payments" => UserNotificationCategory::Payments,
                        _ => continue,
                    };
                    app.disable_category_on_user(
                        user_id.clone(),
                        UserNotificationChannel::Push,
                        category,
                    )
                    .await?;
                }
                if !push.enabled {
                    app.disable_channel_on_user(user_id, UserNotificationChannel::Push)
                        .await?;
                }
            }
        }
        total_accounts += 1;
        if total_accounts % 100 == 0 {
            println!("{total_accounts} accounts sycned");
        }
    }
    println!("SYNCING FINISHED: {total_accounts} accounts sycned");

    Ok(())
}

fn bool_true() -> bool {
    true
}
