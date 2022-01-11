import getUuidByString from "uuid-by-string"

import { GT } from "@graphql/index"

import { Wallets } from "@app"

import IAccount from "../abstract/account"

import WalletId from "../scalar/wallet-id"
import Wallet from "../abstract/wallet"

const BusinessAccount = new GT.Object({
  name: "BusinessAccount",
  interfaces: () => [IAccount],
  isTypeOf: () => false,
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

    walletIds: {
      type: GT.NonNullList(WalletId),
      result: (source, args, { domainAccount }: { domainAccount: Account }) =>
        domainAccount.walletIds,
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
      resolve: async (source) => {
        return Wallets.getCSVForWallets(source.walletIds)
      },
    },
  }),
})

export default BusinessAccount
