import { GT } from "@graphql/index"

import { Wallets } from "@app"
import Transaction from "@graphql/types/object/transaction"

const TransactionByIdQuery = GT.Field({
  type: Transaction,
  args: {
    id: { type: GT.NonNullID },
  },
  resolve: async (_, { id }) => {
    if (id instanceof Error) throw id

    const ledgerTx = await Wallets.getTransactionById(id)
    if (ledgerTx instanceof Error) throw ledgerTx

    return ledgerTx
  },
})

export default TransactionByIdQuery
