import { TransactionMetadata } from "../schema"

import { NoTransactionToUpdateError, UnknownRepositoryError } from "@/domain/errors"
import {
  CouldNotFindExpectedTransactionMetadataError,
  CouldNotFindTransactionMetadataError,
  MismatchedResultForTransactionMetadataQuery,
} from "@/domain/ledger"
import { ErrorLevel } from "@/domain/shared"
import { fromObjectId, toObjectId, parseRepositoryError } from "@/services/mongoose/utils"
import { recordExceptionInCurrentSpan } from "@/services/tracing"
import { ModifiedSet } from "@/utils"

export const TransactionsMetadataRepository = (): ITransactionsMetadataRepository => {
  const updateByHash = async (
    ledgerTxMetadata:
      | OnChainLedgerTransactionMetadataUpdate
      | LnLedgerTransactionMetadataUpdate,
  ): Promise<true | RepositoryError> => {
    const { hash, ...metadata } = ledgerTxMetadata
    try {
      const result = await TransactionMetadata.updateMany({ hash }, metadata)
      const success = result.modifiedCount > 0
      if (!success) {
        return new NoTransactionToUpdateError()
      }
      return true
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const persistAll = async (
    ledgerTxsMetadata: LedgerTransactionMetadata[],
  ): Promise<LedgerTransactionMetadata[] | RepositoryError> => {
    if (ledgerTxsMetadata.length === 0) return []

    try {
      const ledgerTxsMetadataPersist = ledgerTxsMetadata.map(translateToTxMetadataRecord)
      const result: TransactionMetadataRecord[] = await TransactionMetadata.insertMany(
        ledgerTxsMetadataPersist,
      )
      return result.map((txRecord) => translateToLedgerTxMetadata(txRecord))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findById = async (id: LedgerTransactionId) => {
    try {
      const result = await TransactionMetadata.findOne({
        _id: toObjectId<LedgerTransactionId>(id),
      })
      if (!result) return new CouldNotFindTransactionMetadataError()
      return translateToLedgerTxMetadata(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByHash = async (hash: PaymentHash | OnChainTxHash) => {
    try {
      const result = await TransactionMetadata.findOne({
        hash,
      })
      if (!result) return new CouldNotFindTransactionMetadataError()
      return translateToLedgerTxMetadata(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const listByIds = async (
    ids: LedgerTransactionId[],
  ): Promise<(LedgerTransactionMetadata | RepositoryError)[] | RepositoryError> => {
    const objectIds = ids.map((id) => toObjectId<LedgerTransactionId>(id))
    try {
      const agg = TransactionMetadata.aggregate()
        .match({ _id: { $in: objectIds } })
        .addFields({ __order: { $indexOfArray: [objectIds, "$_id"] } })
        .sort({ __order: 1 })
        .cursor({ batchSize: 100 })

      const result: TransactionMetadataRecord[] = []
      for await (const txn of agg) {
        result.push(txn)
      }

      // If arrays mismatched, record errors but return sensible array
      if (result.length !== ids.length) {
        const idsSet = new ModifiedSet(ids)
        const resultIdsSet = new ModifiedSet(result.map((txn) => fromObjectId(txn._id)))
        const idsSetDiff = idsSet.difference(resultIdsSet)
        const resultIdsSetDiff = idsSet.difference(idsSet)

        if (idsSetDiff.size > 0) {
          const errMsg = Array.from(idsSet)
            .map((id) => ` ${id}`)
            .toString()
            .trimStart()
          recordExceptionInCurrentSpan({
            error: new CouldNotFindExpectedTransactionMetadataError(errMsg),
            level: ErrorLevel.Critical,
          })
        }

        if (resultIdsSetDiff.size > 0) {
          const errMsg = Array.from(resultIdsSet)
            .map((id) => ` ${id}`)
            .toString()
            .trimStart()
          recordExceptionInCurrentSpan({
            error: new MismatchedResultForTransactionMetadataQuery(errMsg),
            level: ErrorLevel.Critical,
          })
        }

        return ids.map((id) => {
          const txn = result.find((txn) => id === fromObjectId(txn._id))
          return txn !== undefined
            ? translateToLedgerTxMetadata(txn)
            : new CouldNotFindTransactionMetadataError()
        })
      }

      return result.map((txn) => translateToLedgerTxMetadata(txn))
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  return {
    updateByHash,
    persistAll,
    findById,
    findByHash,
    listByIds,
  }
}

const translateToLedgerTxMetadata = (
  txMetadata: TransactionMetadataRecord,
): LedgerTransactionMetadata => ({
  id: fromObjectId<LedgerTransactionId>(txMetadata._id),
  hash: (txMetadata.hash as PaymentHash | OnChainTxHash) || undefined,
  revealedPreImage: (txMetadata.revealedPreImage as RevealedPreImage) || undefined,
})

const translateToTxMetadataRecord = (
  txMetadata: LedgerTransactionMetadata,
): TransactionMetadataRecord => {
  return {
    _id: toObjectId<LedgerTransactionId>(txMetadata.id),

    ...("hash" in txMetadata ? { hash: txMetadata.hash } : {}),

    ...("revealedPreImage" in txMetadata
      ? { revealedPreImage: txMetadata.revealedPreImage }
      : {}),
  }
}
