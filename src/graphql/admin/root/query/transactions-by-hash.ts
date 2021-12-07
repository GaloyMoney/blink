import { GT } from "@graphql/index"

import * as Wallets from "@app/wallets"
import Transaction from "@graphql/types/object/transaction"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import { mapError } from "@graphql/error-map"

const TransactionsByHashQuery = GT.Field({
  type: GT.List(Transaction),
  args: {
    hash: { type: GT.NonNull(PaymentHash) },
  },
  resolve: async (_, { hash }) => {
    if (hash instanceof Error) {
      return { errors: [{ message: hash.message }] }
    }

    const ledgerTxs = await Wallets.getTransactionsByHash(hash)
    if (ledgerTxs instanceof Error) {
      return { errors: [{ message: mapError(ledgerTxs).message }] }
    }
    return ledgerTxs
  },
})

export default TransactionsByHashQuery
