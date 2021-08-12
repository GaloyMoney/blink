import { connectionArgs, connectionFromArray } from "graphql-relay"

import { GT } from "@graphql/index"
import { TransactionConnection } from "../abstract/transaction"
import Wallet from "../abstract/wallet"

// import Currency from "../scalars/currency"
// import SignedAmount from "../scalars/signed-amount"

const FiatWallet = new GT.Object({
  name: "FiatWallet",
  interfaces: () => [Wallet],
  isTypeOf: (source) => source.type === "fiat", // TODO: make this work
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
    // storageCurrency: {
    //   type: GT.NonNull(Currency),
    // },
    // balance: {
    //   type: GT.NonNull(SignedAmount),
    // },
    transactions: {
      type: TransactionConnection,
      args: connectionArgs,
      resolve: (source, args) => {
        return connectionFromArray(source.transactions, args)
      },
    },
  }),
})

export default FiatWallet
