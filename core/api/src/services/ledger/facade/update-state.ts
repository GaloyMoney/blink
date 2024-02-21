import { Transaction } from "../books"
import { NoTransactionToUpdateStateError, UnknownLedgerError } from "../domain/errors"

import { getTransactionsForWalletsByPaymentHash } from "./get-transactions"

import { recordExceptionInCurrentSpan } from "@/services/tracing"

import { LnPaymentStateDeterminator } from "@/domain/ledger/ln-payment-state"

import { ErrorLevel } from "@/domain/shared"

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
  walletIds,
  paymentHash,
}: {
  walletIds: WalletId[]
  paymentHash: PaymentHash
}): Promise<boolean | ApplicationError> => {
  const txns = await getTransactionsForWalletsByPaymentHash({
    walletIds,
    paymentHash,
  })
  if (txns instanceof Error) return txns

  const lnPaymentState = LnPaymentStateDeterminator(txns).determine()
  if (lnPaymentState instanceof Error) {
    recordExceptionInCurrentSpan({
      error: lnPaymentState,
      level: ErrorLevel.Critical,
      attributes: {
        ["error.actionRequired.message"]:
          "Check the transaction bundle using the paymentHash and walletIds, " +
          "determine the transaction state type, and manually update transactions " +
          "with this hash to the correct state.",
        ["error.actionRequired.paymentHash"]: paymentHash,
        ["error.actionRequired.walletIds"]: JSON.stringify(walletIds),
      },
    })
    return false
  }

  return updateStateByHash({
    paymentHash,
    bundle_completion_state: lnPaymentState,
  })
}
