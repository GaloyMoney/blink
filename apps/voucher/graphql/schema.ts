const typeDefs = `#graphql
type WithdrawLink {
  id: ID!
  userId: ID!
  paymentRequest: String!
  paymentHash: String!
  paymentSecret: String!
  salesAmount: Float!
  accountType: String!
  escrowWallet: String!
  status: Status!
  title: String!
  voucherAmount: Float!
  uniqueHash: String!
  k1: String
  createdAt: String!
  updatedAt: String!
  commissionPercentage: Float
  identifierCode: String
  secretCode: String
  invoiceExpiration: String!
}

type FeesResult {
  fees: Float!
}

type SendPaymentOnChainResult {
  status: String!
  amount: Float!
}

type WithdrawLinksByUserIdResult {
  withdrawLinks: [WithdrawLink!]!
  totalLinks: Int!
}

enum Status {
  FUNDED
  UNFUNDED
  PAID
}

type Query {
  getWithdrawLink(id: ID, uniqueHash: String, k1: String, paymentHash: String, secretCode: String, identifierCode: String  ): WithdrawLink
  getAllWithdrawLinks: [WithdrawLink!]!
  getWithdrawLinksByUserId(userId: ID!, status: Status, limit: Int, offset: Int): WithdrawLinksByUserIdResult!
  getOnChainPaymentFees(id: ID!, btcWalletAddress: String!): FeesResult!
}

type Mutation {
  createWithdrawLink(input: CreateWithdrawLinkInput!): WithdrawLink!
  updateWithdrawLink(id: ID!, input: UpdateWithdrawLinkInput!): WithdrawLink!
  deleteWithdrawLink(id: ID!): ID!
  sendPaymentOnChain(id: ID!, btcWalletAddress: String!): SendPaymentOnChainResult!
}

input CreateWithdrawLinkInput {
  userId: ID!
  paymentRequest: String!
  paymentHash: String!
  paymentSecret: String!
  salesAmount: Float!
  accountType: String!
  escrowWallet: String!
  title: String!
  voucherAmount: Float!
  uniqueHash: String!
}

input UpdateWithdrawLinkInput {
  userId: ID
  paymentRequest: String
  paymentHash: String
  paymentSecret: String
  salesAmount: Float
  accountType: String
  escrowWallet: String
  status: Status
  title: String
  voucherAmount: Float
  uniqueHash: String
  k1: String
  commissionPercentage: Float
}
`

export default typeDefs
