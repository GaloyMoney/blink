import { Wallets } from "@app"
import { GT } from "@graphql/index"
import getUuidByString from "uuid-by-string"

import IAccount from "../abstract/account"
import Wallet from "../abstract/wallet"
import WalletId from "../scalar/wallet-id"

const ConsumerAccount = new GT.Object({
  name: "ConsumerAccount",
  interfaces: () => [IAccount],
  isTypeOf: () => true, // TODO: improve

  fields: () => ({
    id: {
      type: GT.NonNullID,
      resolve: (source) => getUuidByString(source.id),
    },

    wallets: {
      type: GT.NonNullList(Wallet),
      resolve: async (source: Account) => {
        const walletIds = await Wallets.listWalletIdsByAccountId(source.id)
        if (walletIds instanceof Error) return walletIds

        const wallets = walletIds.map(async (id: WalletId) => {
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
      description:
        "return CSV stream, base64 encoded, of the list of transactions in the wallet",
      type: GT.NonNull(GT.String),
      args: {
        walletIds: {
          type: GT.NonNullList(WalletId),
        },
      },
      resolve: async (source: Account) => {
        const walletIds = await Wallets.listWalletIdsByAccountId(source.id)
        if (walletIds instanceof Error) return walletIds

        return Wallets.getCSVForWallets(walletIds)
      },
    },
  }),
})

export default ConsumerAccount
