import { GT } from "@graphql/index"

import WalletId from "../scalar/wallet-id"

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
    csvTransactions: {
      type: GT.NonNull(GT.String),
      args: {
        walletIds: {
          type: GT.NonNullList(WalletId),
        },
      },
    },

    // FUTURE-PLAN: Support a `users: [User!]!` field here
  }),
})

export default IAccount
