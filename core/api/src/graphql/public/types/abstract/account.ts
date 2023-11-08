import AccountLevel from "../../../shared/types/scalar/account-level"

import Wallet from "../../../shared/types/abstract/wallet"

import CallbackEndpoint from "../object/callback-endpoint"

import { NotificationSettings } from "../object/notification-settings"

import { GT } from "@/graphql/index"
import { connectionArgs } from "@/graphql/connections"

import WalletId from "@/graphql/shared/types/scalar/wallet-id"
import AccountLimits from "@/graphql/public/types/object/account-limits"
import RealtimePrice from "@/graphql/public/types/object/realtime-price"
import DisplayCurrency from "@/graphql/shared/types/scalar/display-currency"
import Transaction, {
  TransactionConnection,
} from "@/graphql/shared/types/object/transaction"

const IAccount = GT.Interface({
  name: "Account",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    callbackEndpoints: {
      type: GT.NonNullList(CallbackEndpoint),
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
    pendingTransactions: {
      type: GT.NonNullList(Transaction),
      args: {
        walletIds: {
          type: GT.List(WalletId),
        },
      },
    },
    notificationSettings: {
      type: GT.NonNull(NotificationSettings),
    },
    walletById: {
      type: GT.NonNull(Wallet),
      args: {
        walletId: {
          type: GT.NonNull(WalletId),
        },
      },
    },
    // FUTURE-PLAN: Support a `users: [User!]!` field here
  }),
})

export default IAccount
