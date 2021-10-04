import { GT } from "@graphql/index"
import * as Wallets from "@app/wallets"
import ITransaction from "@graphql/types/abstract/transaction"

const TransactionsByHashQuery = GT.Field({
  type: GT.List(ITransaction),
  args: {
    hash: { type: GT.NonNull(GT.String) },
  },
  resolve: async (_, { hash }) => {
    if (hash instanceof Error) throw hash

    const ledgerTxs = await Wallets.getTransactionsByHash(hash)
    if (ledgerTxs instanceof Error) throw ledgerTxs

    return ledgerTxs
  },
})

export default TransactionsByHashQuery
