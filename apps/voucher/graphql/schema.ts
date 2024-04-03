//TODO need to add error fields
const typeDefs = `#graphql
type WithdrawLink {
  id: ID!
  user_id: ID!
  payment_request: String!
  payment_hash: String!
  payment_secret: String!
  sales_amount: Float!
  account_type: String!
  escrow_wallet: String!
  status: Status!
  title: String!
  voucher_amount: Float!
  unique_hash: String!
  k1: String
  created_at: String!
  updated_at: String!
  commission_percentage: Float
  identifier_code: String
  secret_code: String
  invoice_expiration: String!
}

type FeesResult {
  fees: Float!
}

type sendPaymentOnChainResult {
  status: String!
  amount: Float!
}

type WithdrawLinksByUserIdResult {
  withdrawLinks: [WithdrawLink!]!
  total_links: Int
}

enum Status {
  FUNDED
  UNFUNDED
  PAID
}

type Query {
  getWithdrawLink(id: ID, unique_hash: String, k1: String, payment_hash: String, secret_code: String, identifier_code: String  ): WithdrawLink
  getAllWithdrawLinks: [WithdrawLink!]!
  getWithdrawLinksByUserId(user_id: ID!, status: Status, limit: Int, offset: Int): WithdrawLinksByUserIdResult!
  getOnChainPaymentFees(id: ID!, btc_wallet_address: String!): FeesResult!
}

type Mutation {
  createWithdrawLink(input: CreateWithdrawLinkInput!): WithdrawLink!
  updateWithdrawLink(id: ID!, input: UpdateWithdrawLinkInput!): WithdrawLink!
  deleteWithdrawLink(id: ID!): ID!
  sendPaymentOnChain(id: ID!, btc_wallet_address: String!): sendPaymentOnChainResult!
}

input CreateWithdrawLinkInput {
  id:ID
  user_id: ID!
  payment_request: String!
  payment_hash: String!
  payment_secret: String!
  sales_amount: Float!
  account_type: String!
  escrow_wallet: String!
  status: Status
  title: String!
  voucher_amount: Float!
  unique_hash: String!
  k1: String
  commission_percentage: Float
}

input UpdateWithdrawLinkInput {
  user_id: ID
  payment_request: String
  payment_hash: String
  payment_secret: String
  sales_amount: Float
  account_type: String
  escrow_wallet: String
  status: Status
  title: String
  voucher_amount: Float
  unique_hash: String
  k1: String
  commission_percentage: Float
}
`;

export default typeDefs;
