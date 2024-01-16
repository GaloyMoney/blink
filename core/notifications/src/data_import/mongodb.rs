use super::config::*;
use mongodb::{
    options::{ClientOptions, ReadPreference, ReadPreferenceOptions, SelectionCriteria},
    Client,
};

pub async fn get_client(mongodb_config: MongoImportConfig) -> anyhow::Result<Client> {
    let mut client_options = ClientOptions::parse(mongodb_config.connection).await?;
    client_options.selection_criteria = Some(SelectionCriteria::ReadPreference(
        ReadPreference::SecondaryPreferred {
            options: ReadPreferenceOptions::default(),
        },
    ));
    Ok(Client::with_options(client_options)?)
}
