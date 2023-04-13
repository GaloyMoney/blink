import { GT } from "@graphql/index"
import { connectionArgs } from "@graphql/connections"

import WalletId from "@graphql/types/scalar/wallet-id"
import AccountLimits from "@graphql/types/object/account-limits"
import RealtimePrice from "@graphql/types/object/realtime-price"
import DisplayCurrency from "@graphql/types/scalar/display-currency"
import { TransactionConnection } from "@graphql/types/object/transaction"

import AccountLevel from "../scalar/account-level"

import Wallet from "./wallet"

const IAccount = GT.Interface({
  name: "Account",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    wallets: {
      type: GT.NonNullList(Wallet),
    },
    defaultWalletId: {
      type: GT.NonNull(WalletId),
    },
    displayCurrency: {
      type: GT.NonNull(DisplayCurrency),
    },
    level: {
      type: GT.NonNull(AccountLevel),
    },
    realtimePrice: {
      type: GT.NonNull(RealtimePrice),
    },
    csvTransactions: {
      type: GT.NonNull(GT.String),
      args: {
        walletIds: {
          type: GT.NonNullList(WalletId),
        },
      },
    },
    limits: {
      type: GT.NonNull(AccountLimits),
    },
    transactions: {
      type: TransactionConnection,
      args: {
        ...connectionArgs,
        walletIds: {
          type: GT.List(WalletId),
        },
      },
    },

    // FUTURE-PLAN: Support a `users: [User!]!` field here
  }),
})

export default IAccount
