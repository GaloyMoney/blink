// import BusinessAccount from "./object/business-account"
import BTCWallet from "./object/btc-wallet"
import ConsumerAccount from "./object/consumer-account"
// import FiatWallet from "./object/fiat-wallet"
import WalletNameTransaction from "./object/wallet-name-transaction"
import LnTransaction from "./object/ln-transaction"
import OnChainTransaction from "./object/onchain-transaction"
import InputError from "./object/input-error"
import PaymentError from "./object/payment-error"

// The following types are not directly included
// in the GraphQL schema. They only implement interfaces.
// They need to be included via GraphQLSchema.types config
export const TYPE_FOR_INTERFACES = [
  InputError,
  PaymentError,
  ConsumerAccount,
  // BusinessAccount,
  BTCWallet,
  // FiatWallet,
  WalletNameTransaction,
  OnChainTransaction,
  LnTransaction,
]
