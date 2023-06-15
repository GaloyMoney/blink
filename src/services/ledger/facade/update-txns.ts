import { Transaction } from "../schema"
import { NoTransactionToSettleError, UnknownLedgerError } from "../domain/errors"
import { TransactionsMetadataRepository } from "../services"

export const settlePendingLnSend = async (
  paymentHash: PaymentHash,
): Promise<true | LedgerServiceError> => {
  try {
    const result = await Transaction.updateMany({ hash: paymentHash }, { pending: false })
    const success = result.modifiedCount > 0
    if (!success) {
      return new NoTransactionToSettleError()
    }
    return true
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const updateMetadataByHash = async (
  ledgerTxMetadata:
    | OnChainLedgerTransactionMetadataUpdate
    | LnLedgerTransactionMetadataUpdate,
): Promise<true | LedgerServiceError | RepositoryError> =>
  TransactionsMetadataRepository().updateByHash(ledgerTxMetadata)
