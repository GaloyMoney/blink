import { GT } from "@graphql/index"

import * as Wallets from "@app/wallets"
import ITransaction from "@graphql/types/abstract/transaction"
import { CouldNotFindTransactionError } from "@domain/ledger"

const TransactionByIdQuery = GT.Field({
  type: ITransaction,
  args: {
    id: { type: GT.NonNullID },
  },
  resolve: async (_, { id }) => {
    if (id instanceof Error) throw id

    const ledgerTx = await Wallets.getTransactionById(id)
    if (ledgerTx instanceof CouldNotFindTransactionError) return null
    if (ledgerTx instanceof Error) throw ledgerTx

    return ledgerTx
  },
})

export default TransactionByIdQuery
