import getUuidByString from "uuid-by-string"

import { GT } from "@graphql/index"

import { Wallets } from "@app"

import IAccount from "../abstract/account"

import WalletId from "../scalar/wallet-id"

import Transaction from "./transaction"

const BusinessAccount = new GT.Object({
  name: "BusinessAccount",
  interfaces: () => [IAccount],
  isTypeOf: () => false, // source.title || source.coordinates, // TODO: improve
  fields: () => ({
    id: {
      type: GT.NonNullID,
      resolve: (source) => getUuidByString(source.id),
    },

    allTransactions: {
      type: GT.NonNullList(Transaction),
    },

    csvTransactions: {
      type: GT.NonNull(GT.String),
      args: {
        walletIds: {
          type: GT.NonNullList(WalletId),
        },
      },
      resolve: async (source: Account) => {
        return Wallets.getCSVForWallets(source.walletIds)
      },
    },
  }),
})

export default BusinessAccount
