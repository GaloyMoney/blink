use super::{account_details::AccountDetails, queries::*, AdminClientError};

impl TryFrom<account_details_by_user_id::ResponseData> for AccountDetails {
    type Error = AdminClientError;

    fn try_from(value: account_details_by_user_id::ResponseData) -> Result<Self, Self::Error> {
        let id = value.account_details_by_user_id.id;
        Ok(Self { id })
    }
}
