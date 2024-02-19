import { GT } from "@/graphql/index"

import { Wallets } from "@/app"
import { mapError } from "@/graphql/error-map"
import Transaction from "@/graphql/shared/types/object/transaction"
import LnPaymentRequest from "@/graphql/shared/types/scalar/ln-payment-request"

const TransactionsByPaymentRequestQuery = GT.Field({
  type: GT.List(Transaction),
  args: {
    paymentRequest: { type: GT.NonNull(LnPaymentRequest) },
  },
  resolve: async (_, { paymentRequest }) => {
    if (paymentRequest instanceof Error) throw paymentRequest

    const ledgerTxs = await Wallets.getTransactionsByPaymentRequest({
      uncheckedPaymentRequest: paymentRequest,
    })
    if (ledgerTxs instanceof Error) {
      throw mapError(ledgerTxs)
    }

    return ledgerTxs
  },
})

export default TransactionsByPaymentRequestQuery
