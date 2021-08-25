import { connectionArgs, connectionFromArray } from "graphql-relay"

import { GT } from "@graphql/index"

import { TransactionConnection } from "../abstract/transaction"
import IWallet from "../abstract/wallet"
import SignedAmount from "../scalar/signed-amount"
import Currency from "../scalar/currency"
import * as Wallets from "@app/wallets"

const BTCWallet = new GT.Object({
  name: "BTCWallet",
  interfaces: () => [IWallet],
  isTypeOf: (source) => true || source.type === "btc", // TODO: make this work
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    storageCurrency: {
      type: GT.NonNull(Currency),
    },
    balance: {
      type: GT.NonNull(SignedAmount),
    },

    transactions: {
      type: TransactionConnection,
      args: connectionArgs,
      resolve: async (source: Wallet, args) => {
        const { result: transactions, error } = await Wallets.getTransactionsForWallet(
          source,
        )
        if (error instanceof Error || transactions === null) {
          throw error
        }
        return connectionFromArray(transactions, args)
      },
    },
  }),
})

export default BTCWallet
