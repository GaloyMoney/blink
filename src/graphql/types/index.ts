// import BusinessAccount from "./object/business-account"
import BtcWallet from "./object/btc-wallet"
import ConsumerAccount from "./object/consumer-account"
import UsdWallet from "./object/usd-wallet"
import InputError from "./object/input-error"
import PaymentError from "./object/payment-error"

// The following types are not directly included
// in the GraphQL schema. They only implement interfaces.
// They need to be included via GraphQLSchema.types config
export const ALL_INTERFACE_TYPES = [
  InputError,
  PaymentError,
  ConsumerAccount,
  // BusinessAccount,
  BtcWallet,
  UsdWallet,
]
