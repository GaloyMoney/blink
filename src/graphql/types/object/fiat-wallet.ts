import { connectionArgs, connectionFromArray } from "graphql-relay"

import { GT } from "@graphql/index"
import { TransactionConnection } from "../abstract/transaction"
import Wallet from "../abstract/wallet"
import Currency from "../scalar/currency"
import SignedAmount from "../scalar/signed-amount"
import * as Wallets from "@app/wallets"

const FiatWallet = new GT.Object({
  name: "FiatWallet",
  interfaces: () => [Wallet],
  isTypeOf: (source) => source.type === "fiat", // TODO: make this work
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

export default FiatWallet
