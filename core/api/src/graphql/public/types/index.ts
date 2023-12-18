// import BusinessAccount from "./object/business-account"
import BtcWallet from "../../shared/types/object/btc-wallet"

import GraphQLApplicationError from "../../shared/types/object/graphql-application-error"

import UsdWallet from "../../shared/types/object/usd-wallet"

import ConsumerAccount from "./object/consumer-account"
import OneDayAccountLimit from "./object/one-day-account-limit"

// The following types are not directly included
// in the GraphQL schema. They only implement interfaces.
// They need to be included via GraphQLSchema.types config
export const ALL_INTERFACE_TYPES = [
  GraphQLApplicationError,
  ConsumerAccount,
  // BusinessAccount,
  BtcWallet,
  UsdWallet,
  OneDayAccountLimit,
]
