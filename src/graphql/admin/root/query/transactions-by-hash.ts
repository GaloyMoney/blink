import { GT } from "@graphql/index"

import { Wallets } from "@app"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import TransactionWithMetadata from "@graphql/types/object/transaction-with-metadata"

const TransactionsByHashQuery = GT.Field({
  type: GT.List(TransactionWithMetadata),
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
