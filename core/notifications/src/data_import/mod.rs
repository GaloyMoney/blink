use anyhow::*;
use sqlx::{Postgres, QueryBuilder, Row};

mod config;

use crate::{app::NotificationsApp, primitives::*};
pub use config::*;

pub async fn import_email_addresses(
    app: NotificationsApp,
    config: KratosImportConfig,
) -> anyhow::Result<()> {
    println!("EXECUTING EMAIL IMPORT");
    let pool = sqlx::postgres::PgPoolOptions::new()
        .connect(&config.pg_con.expect("pg_con not set"))
        .await?;
    let mut last_email = String::new();
    let mut total_users = 0;
    loop {
        let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"SELECT id, traits->>'email' AS email
              FROM identities
              WHERE traits->>'email' IS NOT NULL
                  AND traits->>'email' >"#,
        );
        query_builder.push_bind(&last_email);
        query_builder.push("ORDER BY traits->>'email' LIMIT 1000;");
        let query = query_builder.build();
        let res = query.fetch_all(&pool).await?;
        if res.is_empty() {
            break;
        }
        for row in res {
            let id: uuid::Uuid = row.get("id");
            let email: String = row.get("email");
            app.update_email_address(
                GaloyUserId::from(id.to_string()),
                GaloyEmailAddress::from(email.clone()),
            )
            .await?;
            total_users += 1;
            last_email = email;
        }
        println!("First {total_users} synced");
    }
    println!("SYNCING FINISHED: {total_users} users synced");
    Ok(())
}
