import { GT } from "@graphql/index"
import { WalletsRepository } from "@services/mongoose"

import WalletId from "../scalar/wallet-id"

import Wallet from "./wallet"

const IAccount = new GT.Interface({
  name: "Account",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    wallets: {
      type: GT.NonNullList(Wallet),
      resolve: async (source, args, { domainAccount }: { domainAccount: Account }) => {
        return WalletsRepository().listByAccountId(domainAccount.id)
      },
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
