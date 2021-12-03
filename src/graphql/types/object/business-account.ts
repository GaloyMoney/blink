import getUuidByString from "uuid-by-string"

import { GT } from "@graphql/index"

import IAccount from "../abstract/account"
import Transaction from "./transaction"
import WalletId from "../scalar/wallet-id"

import * as Wallets from "@app/wallets"
import * as Accounts from "@app/accounts"

const BusinessAccount = new GT.Object({
  name: "BusinessAccount",
  interfaces: () => [IAccount],
  isTypeOf: (source) => source.title || source.coordinates, // TODO: improve
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

export default BusinessAccount
