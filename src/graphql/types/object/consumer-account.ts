import getUuidByString from "uuid-by-string"

import { GT } from "@graphql/index"

import IAccount from "../abstract/account"
import Wallet from "../abstract/wallet"
import WalletId from "../scalar/wallet-id"

import * as Wallets from "@app/wallets"
import * as Accounts from "@app/accounts"

const ConsumerAccount = new GT.Object({
  name: "ConsumerAccount",
  interfaces: () => [IAccount],
  isTypeOf: (source) => !source.title && !source.coordinate, // TODO: improve

  fields: () => ({
    id: {
      type: GT.NonNullID,
      resolve: (source) => getUuidByString(source.id),
    },

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

    defaultWalletId: {
      type: GT.NonNull(WalletId),
      resolve: (source, args, { domainAccount }: { domainAccount: Account }) =>
        domainAccount.defaultWalletId,
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
