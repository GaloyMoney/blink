import { Transaction } from "../books"
import { NoTransactionToUpdateStateError, UnknownLedgerError } from "../domain/errors"

import { getTransactionsForWalletsByPaymentHash } from "./get-transactions"

import { toObjectId } from "@/services/mongoose/utils"
import { recordExceptionInCurrentSpan } from "@/services/tracing"

import { LnPaymentStateDeterminator } from "@/domain/ledger/ln-payment-state"

import { ErrorLevel } from "@/domain/shared"

const updateStateByRelatedJournal = async ({
  journalId,
  bundleCompletionState,
}: {
  journalId: LedgerJournalId
  bundleCompletionState: LnPaymentState
}): Promise<true | LedgerServiceError | RepositoryError> => {
  try {
    const result = await Transaction.updateMany(
      {
        $or: [
          { _journal: toObjectId(journalId) },
          { _original_journal: toObjectId(journalId) },
          { related_journal: toObjectId(journalId) },
          { related_journal: journalId }, // needed because we've stored as 'string' and 'objectId' type in prod
        ],
      },
      { bundle_completion_state: bundleCompletionState },
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
  journalId,
}: {
  walletIds: WalletId[]
  paymentHash: PaymentHash
  journalId: LedgerJournalId
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
          "Check the transaction bundle using the '_journal', 'related_journal' and " +
          "walletIds, determine the transaction state type, and manually update " +
          "transactions with this '_journal' and 'related_journal' to the correct state.",
        ["error.actionRequired.paymentHash"]: paymentHash,
        ["error.actionRequired.walletIds"]: JSON.stringify(walletIds),
      },
    })
    return false
  }

  return updateStateByRelatedJournal({
    journalId,
    bundleCompletionState: lnPaymentState,
  })
}
