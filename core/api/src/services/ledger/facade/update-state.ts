import { LedgerService } from ".."
import { Transaction } from "../books"
import { NoTransactionToUpdateStateError, UnknownLedgerError } from "../domain/errors"

import { LnPaymentStateDeterminator } from "@/domain/ledger/ln-payment-state"

const updateStateByHash = async ({
  paymentHash,
  bundle_completion_state,
}: {
  paymentHash: PaymentHash
  bundle_completion_state: LnPaymentState
}): Promise<true | LedgerServiceError | RepositoryError> => {
  try {
    const result = await Transaction.updateMany(
      { hash: paymentHash },
      { bundle_completion_state },
    )
    const success = result.modifiedCount > 0
    if (!success) {
      return new NoTransactionToUpdateStateError()
    }
    return true
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const updateLnPaymentState = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<true | ApplicationError> => {
  // FIXME: temporary circular dependency from index.ts
  const txns = await LedgerService().getTransactionsForWalletByPaymentHash({
    walletId,
    paymentHash,
  })
  if (txns instanceof Error) return txns

  const lnPaymentState = LnPaymentStateDeterminator(txns).determine()
  if (lnPaymentState instanceof Error) {
    return lnPaymentState
  }

  return updateStateByHash({
    paymentHash,
    bundle_completion_state: lnPaymentState,
  })
}
