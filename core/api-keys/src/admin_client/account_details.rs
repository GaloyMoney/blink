use serde::{Deserialize, Serialize};

const ACCOUNT_DETAILS_BY_USER_ID_QUERY: &str = "
query AccountDetailsByUserId($userId: ID!) {
    accountDetailsByUserId(userId: $userId) {
        id
    }
}
";

#[derive(Serialize)]
pub struct AccountDetailsVariables {
    pub user_id: String,
}

#[derive(Serialize)]
pub struct GraphQLRequest {
    query: String,
    variables: AccountDetailsVariables,
}

#[derive(Deserialize)]
pub struct AccountDetailsResponse {
    data: AccountDetailsResponseData,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountDetailsResponseData {
    pub account_details_by_user_id: AccountDetails,
}

#[derive(Deserialize)]
pub struct AccountDetails {
    pub id: String,
}

impl AccountDetails {
    pub(super) fn request(variables: AccountDetailsVariables) -> GraphQLRequest {
        GraphQLRequest {
            query: ACCOUNT_DETAILS_BY_USER_ID_QUERY.to_string(),
            variables,
        }
    }
}

impl From<AccountDetailsResponse> for AccountDetails {
    fn from(value: AccountDetailsResponse) -> Self {
        value.data.account_details_by_user_id
    }
}
