use super::config::*;
use mongodb::{
    options::{
        ClientOptions, Credential, ReadPreference, ReadPreferenceOptions, SelectionCriteria,
        ServerAddress,
    },
    Client,
};

async fn _get_client(mongodb_config: MongodbConfig, mongodb_pw: String) -> anyhow::Result<Client> {
    let port = mongodb_config.port;
    let client_options = ClientOptions::builder()
        .hosts(
            mongodb_config
                .hosts
                .into_iter()
                .map(|host| ServerAddress::Tcp {
                    host,
                    port: Some(port),
                })
                .collect::<Vec<_>>(),
        )
        .default_database(mongodb_config.database.to_string())
        .credential(
            Credential::builder()
                .username(mongodb_config.username)
                .password(mongodb_pw)
                .source(mongodb_config.database)
                .build(),
        )
        .direct_connection(mongodb_config.direct_connection.unwrap_or(false))
        .selection_criteria(SelectionCriteria::ReadPreference(
            ReadPreference::SecondaryPreferred {
                options: ReadPreferenceOptions::default(),
            },
        ));
    Ok(Client::with_options(client_options.build())?)
}
