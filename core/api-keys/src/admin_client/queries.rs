use graphql_client::GraphQLQuery;

#[derive(GraphQLQuery)]
#[graphql(
    schema_path = "../api/src/graphql/admin/schema.graphql",
    query_path = "src/admin_client/graphql/queries/account_details_by_user_id.gql",
    response_derives = "Debug, PartialEq, Clone"
)]
pub struct AccountDetailsByUserId;
pub type ID = String;
