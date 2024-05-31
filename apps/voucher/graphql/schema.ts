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
  displayVoucherPrice: String!
  displayCurrency: String!
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
  displayVoucherPrice: String!
  displayCurrency: String!  
}

type WithdrawLinksByUserIdResult {
  withdrawLinks: [WithdrawLink!]!
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
  getWithdrawLinksByUserId(status: Status): WithdrawLinksByUserIdResult!
}

type Mutation {
  createWithdrawLink(input: CreateWithdrawLinkInput!): WithdrawLinkWithSecret!
  redeemWithdrawLinkOnChain(input: RedeemWithdrawLinkOnChainInput!): RedeemWithdrawLinkOnChainResult!
}

input CreateWithdrawLinkInput {
  salesAmountInCents: Float!
  walletId: ID!
  commissionPercentage: Float
  displayVoucherPrice: String!
  displayCurrency: String!
}

input RedeemWithdrawLinkOnChainInput {
  voucherSecret: String!
  onChainAddress: String!
}
`

export default typeDefs
