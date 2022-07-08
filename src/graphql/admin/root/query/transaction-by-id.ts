import { GT } from "@graphql/index"

import { Wallets } from "@app"
import TransactionWithMetadata from "@graphql/types/object/transaction-with-metadata"

const TransactionByIdQuery = GT.Field({
  type: TransactionWithMetadata,
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
