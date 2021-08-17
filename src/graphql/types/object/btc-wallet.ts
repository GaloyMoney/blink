import { connectionArgs, connectionFromArray } from "graphql-relay"

import * as Wallets from "@app/wallets"
import { GT } from "@graphql/index"
import { TransactionConnection } from "../abstract/transaction"
import Wallet from "../abstract/wallet"

const BTCWallet = new GT.Object({
  name: "BTCWallet",
  interfaces: () => [Wallet],
  isTypeOf: (source) => true || source.type === "btc", // TODO: make this work
  fields: () => ({
    id: {
      type: GT.NonNullID,
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
