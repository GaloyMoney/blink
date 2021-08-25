import * as Wallets from "@app/wallets"
import { GT } from "@graphql/index"
import IAccount from "../abstract/account"
// import Transaction from "../abstract/transaction"
import Wallet from "../abstract/wallet"

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
        const wallets = source.walletIds.map((id: WalletId) => {
          const wallet = Wallets.getWallet(id)
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
          type: GT.NonNullList(GT.ID),
        },
      },
    },
  }),
})

export default ConsumerAccount
