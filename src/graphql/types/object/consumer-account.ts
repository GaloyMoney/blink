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
      resolve: async (source) => {
        return Wallets.getCSVForWallets(source.walletIds)
      },
    },
  }),
})

export default ConsumerAccount
