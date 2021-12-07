import { GT } from "@graphql/index"

import { Wallets } from "@app"
import Transaction from "@graphql/types/object/transaction"
import PaymentHash from "@graphql/types/scalar/payment-hash"

const TransactionsByHashQuery = GT.Field({
  type: GT.List(Transaction),
  args: {
    hash: { type: GT.NonNull(PaymentHash) },
  },
  resolve: async (_, { hash }) => {
    if (hash instanceof Error) throw hash

    const ledgerTxs = await Wallets.getTransactionsByHash(hash)
    if (ledgerTxs instanceof Error) throw ledgerTxs

    return ledgerTxs
  },
})

export default TransactionsByHashQuery
