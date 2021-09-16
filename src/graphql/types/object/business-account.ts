import * as Wallets from "@app/wallets"
import { getStringCsvForWallets } from "@core/wallet-factory"
import { GT } from "@graphql/index"
import IAccount from "../abstract/account"
import Transaction from "../abstract/transaction"
import WalletName from "../scalar/wallet-name"

// import Wallet from "../abstract/wallet"
// import AccountLevel from "../scalar/account-level"
// import AccountStatus from "../scalar/account-status"
// import Limits from "./limits"

const BusinessAccount = new GT.Object({
  name: "BusinessAccount",
  interfaces: () => [IAccount],
  isTypeOf: (source) => source.title || source.coordinate, // TODO: improve
  fields: () => ({
    // level: {
    //   type: GT.NonNull(AccountLevel),
    // },
    // status: {
    //   type: GT.NonNull(AccountStatus),
    // },
    // wallets: {
    //   type: GT.NonNullList(Wallet),
    // },

    // // TODO: confirm
    // canWithdraw: {
    //   type: GT.NonNull(GT.Boolean),
    // },
    // limits: {
    //   type: GT.NonNull(Limits),
    // },

    allTransactions: {
      type: GT.NonNullList(Transaction),
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

export default BusinessAccount
