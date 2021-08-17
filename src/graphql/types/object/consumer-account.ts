import * as Wallets from "@app/wallets"
import { GT } from "@graphql/index"
import Account from "../abstract/account"
import Wallet from "../abstract/wallet"

import AccountLevel from "../scalars/account-level"
import AccountStatus from "../scalars/account-status"

const ConsumerAccount = new GT.Object({
  name: "ConsumerAccount",
  interfaces: () => [Account],
  isTypeOf: (source) => !source.title && !source.coordinate, // TODO: improve
  fields: () => ({
    level: {
      type: GT.NonNull(AccountLevel),
    },
    status: {
      type: GT.NonNull(AccountStatus),
    },
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
  }),
})

export default ConsumerAccount
