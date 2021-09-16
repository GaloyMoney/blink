import * as Wallets from "@app/wallets"
import { getStringCsvForWallets } from "@core/wallet-factory"
import { GT } from "@graphql/index"
import IAccount from "../abstract/account"
import Wallet from "../abstract/wallet"
import WalletName from "../scalar/wallet-name"

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
        walletNames: {
          type: GT.NonNullList(WalletName),
        },
      },
      resolve: async (source, args) => {
        const walletIds: WalletId[] = []

        for (const id of source.walletIds) {
          const wallet = await Wallets.getWallet(id)
          if (wallet instanceof Error) {
            throw wallet
          }
          if (args.walletNames.includes(wallet.walletName)) {
            walletIds.push(wallet.id)
          }
        }

        return getStringCsvForWallets(walletIds)
      },
    },
  }),
})

export default ConsumerAccount
