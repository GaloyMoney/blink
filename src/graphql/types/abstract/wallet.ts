import { connectionArgs, connectionFromArray } from "graphql-relay"

import { GT } from "@graphql/index"
import { TransactionConnection } from "./transaction"

// import Currency from "../scalars/currency"
// import SignedAmount from "../scalars/signed-amount"

const Wallet = new GT.Interface({
  name: "Wallet",
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

export default Wallet
