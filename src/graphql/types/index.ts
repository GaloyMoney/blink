import BTCWallet from "./object/btc-wallet"
import ConsumerAccount from "./object/consumer-account"
import FiatWallet from "./object/fiat-wallet"
import IntraLedgerTransaction from "./object/intra-ledger-transaction"
import LnTransaction from "./object/ln-transaction"
import MerchantAccount from "./object/merchant-account"
import OnChainTransaction from "./object/onchain-transaction"

// The following types are not directly included
// in the GraphQL schema. They only implement interfaces.
// They need to be included via GraphQLSchema.types config
export const TYPE_FOR_INTERFACES = [
  ConsumerAccount,
  MerchantAccount,
  BTCWallet,
  FiatWallet,
  IntraLedgerTransaction,
  OnChainTransaction,
  LnTransaction,
]
