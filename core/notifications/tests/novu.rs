use std::env;

use lib_notifications::{
    notification_event::*, novu::*, primitives::*, user_notification_settings::*,
};

pub async fn init_pool() -> anyhow::Result<sqlx::PgPool> {
    let pg_host = std::env::var("PG_HOST").unwrap_or("localhost".to_string());
    let pg_con = format!("postgres://user:password@{pg_host}:5433/pg");
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(20)
        .connect(&pg_con)
        .await?;
    Ok(pool)
}

#[tokio::test]
async fn notify_circle_grew() -> anyhow::Result<()> {
    if let Ok(novu_api_key) = env::var("NOVU_API_KEY") {
        let settings = UserNotificationSettingsRepo::new(&init_pool().await?);
        let executor = NovuExecutor::init(
            NovuConfig {
                api_key: novu_api_key,
                ..NovuConfig::default()
            },
            settings,
        )?;
        executor
            .notify(CircleGrew {
                user_id: GaloyUserId::from("some-random-user-id".to_string()),
                circle_type: CircleType::Inner,
                this_month_circle_size: 4,
                all_time_circle_size: 10,
            })
            .await?;
    }
    Ok(())
}
