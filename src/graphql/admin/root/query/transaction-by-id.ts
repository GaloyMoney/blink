import * as Wallets from "@app/wallets"
import { mapError } from "@graphql/error-map"
import { GT } from "@graphql/index"
import Transaction from "@graphql/types/object/transaction"

const TransactionByIdQuery = GT.Field({
  type: Transaction,
  args: {
    id: { type: GT.NonNullID },
  },
  resolve: async (_, { id }) => {
    if (id instanceof Error) {
      return { errors: [{ message: id.message }] }
    }

    const ledgerTx = await Wallets.getTransactionById(id)
    if (ledgerTx instanceof Error) {
      return { errors: [{ message: mapError(ledgerTx).message }] }
    }

    return ledgerTx
  },
})

export default TransactionByIdQuery
