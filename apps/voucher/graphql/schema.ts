const typeDefs = `#graphql

enum Status {
  ACTIVE
  PENDING 
  PAID
}

type WithdrawLink {
  id: ID!
  userId: ID!
  status: Status!
  voucherAmountInCents: Float!
  createdAt: String!
  paidAt: String
  salesAmountInCents: Float!
  commissionPercentage: Float!
  identifierCode: String!
}

type WithdrawLinkWithSecret {
  id: ID!
  userId: ID!
  status: Status!
  voucherAmountInCents: Float!
  createdAt: String!
  paidAt: String
  salesAmountInCents: Float!
  identifierCode: String!
  voucherSecret: String!
  commissionPercentage: Float!
  uniqueHash: String!
}

type WithdrawLinksByUserIdResult {
  withdrawLinks: [WithdrawLink!]!
  totalLinks: Int
}

enum RedeemWithdrawLinkOnChainResultStatus{
  Success
  Failed
}

type RedeemWithdrawLinkOnChainResult {
  status: RedeemWithdrawLinkOnChainResultStatus
}

type Query {
  getWithdrawLink(voucherSecret: String): WithdrawLinkWithSecret
  getWithdrawLinksByUserId(status: Status, limit: Int, offset: Int): WithdrawLinksByUserIdResult!
}

type Mutation {
  createWithdrawLink(input: CreateWithdrawLinkInput!): WithdrawLinkWithSecret!
  redeemWithdrawLinkOnChain(input: RedeemWithdrawLinkOnChainInput!): RedeemWithdrawLinkOnChainResult!
}

input CreateWithdrawLinkInput {
  voucherAmountInCents: Float!
  walletId: ID!
  commissionPercentage: Float
}

input RedeemWithdrawLinkOnChainInput {
  voucherSecret: String!
  onChainAddress: String!
}
`

export default typeDefs
