import getUuidByString from "uuid-by-string"

import { GT } from "@graphql/index"

import IAccount from "../abstract/account"
import Transaction from "./transaction"
import WalletId from "../scalar/wallet-id"

import * as Wallets from "@app/wallets"

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
