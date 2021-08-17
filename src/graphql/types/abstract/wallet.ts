import { connectionArgs, connectionFromArray } from "graphql-relay"

import { GT } from "@graphql/index"
import { TransactionConnection } from "./transaction"

const Wallet = new GT.Interface({
  name: "Wallet",
  fields: () => ({
    id: {
      type: GT.NonNullID,
    },
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
