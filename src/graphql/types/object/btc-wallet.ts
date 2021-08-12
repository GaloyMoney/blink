import { connectionArgs, connectionFromArray } from "graphql-relay"

import { GT } from "@graphql/index"
import { TransactionConnection } from "../abstract/transaction"
import Wallet from "../abstract/wallet"

// import Currency from "../scalars/currency"
// import SignedAmount from "../scalars/signed-amount"

const BTCWallet = new GT.Object({
  name: "BTCWallet",
  interfaces: () => [Wallet],
  isTypeOf: (source) => true || source.type === "btc", // TODO: make this work
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
        console.log("**********", source.transactions)
        return connectionFromArray(source.transactions, args)
      },
    },
  }),
})

export default BTCWallet
