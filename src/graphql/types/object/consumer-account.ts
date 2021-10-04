import { GT } from "@graphql/index"

import IAccount from "../abstract/account"
import Wallet from "../abstract/wallet"
import WalletId from "../scalar/wallet-id"

import * as Wallets from "@app/wallets"
import * as Accounts from "@app/accounts"

// import Transaction from "../abstract/transaction"
// import AccountLevel from "../scalar/account-level"
// import AccountStatus from "../scalar/account-status"
// import Limits from "./limits"

const ConsumerAccount = new GT.Object({
  name: "ConsumerAccount",
  interfaces: () => [IAccount],
  isTypeOf: (source) => !source.title && !source.coordinate, // TODO: improve
  fields: () => ({
    // level: {
    //   type: GT.NonNull(AccountLevel),
    // },
    // status: {
    //   type: GT.NonNull(AccountStatus),
    // },
    // canWithdraw: {
    //   type: GT.NonNull(GT.Boolean),
    // },
    // limits: {
    //   type: GT.NonNull(Limits),
    // },

    wallets: {
      type: GT.NonNullList(Wallet),
      resolve: (source) => {
        const wallets = source.walletIds.map(async (id: WalletId) => {
          const wallet = await Wallets.getWallet(id)
          if (wallet instanceof Error) {
            throw wallet
          }
          return wallet
        })
        return wallets
      },
    },

    csvTransactions: {
      type: GT.NonNull(GT.String),
      args: {
        walletIds: {
          type: GT.NonNullList(WalletId),
        },
      },
      resolve: async (source, args) => {
        const walletIds = await Accounts.toWalletIds({
          account: source,
          walletPublicIds: args.walletIds,
        })

        if (walletIds instanceof Error) {
          throw walletIds
        }

        return Wallets.getCSVForWallets(walletIds)
      },
    },
  }),
})

export default ConsumerAccount
