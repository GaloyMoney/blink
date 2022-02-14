import { NoTransactionToUpdateError, UnknownRepositoryError } from "@domain/errors"
import { CouldNotFindTransactionMetadataError } from "@domain/ledger"
import { toObjectId } from "@services/mongoose/utils"

import { TransactionMetadata } from "../schema"

export const TransactionsMetadataRepository = (): ITransactionsMetadataRepository => {
  const updateByHash = async (
    ledgerTxMetadata:
      | OnChainLedgerTransactionMetadataUpdate
      | LnLedgerTransactionMetadataUpdate,
  ): Promise<true | RepositoryError> => {
    const { hash, ...metadata } = ledgerTxMetadata
    try {
      const result = await TransactionMetadata.updateMany({ hash }, metadata)
      const success = result.nModified > 0
      if (!success) {
        return new NoTransactionToUpdateError()
      }
      return true
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }
  const persistNew = async ({
    id,
    ledgerTxMetadata,
  }: PersistNewLedgerTransactionMetadataArgs): Promise<
    LedgerTransactionMetadata | RepositoryError
  > => {
    try {
      return TransactionMetadata.create({ _id: id, ...ledgerTxMetadata })
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }
  const findById = async (id) => {
    try {
      const result = await TransactionMetadata.findOne({
        _id: toObjectId<LedgerTransactionId>(id),
      })
      if (!result) return new CouldNotFindTransactionMetadataError()
      return translateToLedgerTxMetadata(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    updateByHash,
    persistNew,
    findById,
  }
}

const translateToLedgerTxMetadata = (
  txMetadata: TransactionMetadataRecord,
): LedgerTransactionMetadata => ({
  id: txMetadata.id as LedgerTransactionId,
  hash: (txMetadata.hash as PaymentHash | OnChainTxHash) || undefined,
  revealedPreImage: (txMetadata.revealedPreImage as RevealedPreImage) || undefined,
})
