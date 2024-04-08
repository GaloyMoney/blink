import { MainBook, Transaction } from "../books"
import { translateToLedgerTx, translateToLedgerTxAndMetadata } from "../translate"
import { UnknownLedgerError } from "../domain/errors"

import {
  CouldNotFindTransactionsForExternalIdPatternError,
  toLiabilitiesWalletId,
} from "@/domain/ledger"

export const getTransactionsForWalletsByPaymentHash = async ({
  walletIds,
  paymentHash,
}: {
  walletIds: WalletId[]
  paymentHash: PaymentHash
}): Promise<LedgerTransaction<WalletCurrency>[] | LedgerError> => {
  const liabilitiesWalletIds = walletIds.map(toLiabilitiesWalletId)
  try {
    const { results } = await MainBook.ledger({
      account: liabilitiesWalletIds,
      hash: paymentHash,
    })

    return results.map((tx) => translateToLedgerTx(tx))
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const getTransactionsForWalletsByExternalIdPattern = async ({
  walletIds,
  externalIdPattern,
}: {
  walletIds: WalletId[]
  externalIdPattern: PartialLedgerExternalId
}): Promise<LedgerTransaction<WalletCurrency>[] | LedgerError> => {
  try {
    const results: (ILedgerTransaction & TransactionMetadataRecord)[] =
      await Transaction.aggregate([
        {
          $match: {
            account_path: { $in: walletIds },
          },
        },
        {
          $lookup: {
            from: "medici_transaction_metadatas",
            localField: "_id", // field from the transactions collection
            foreignField: "_id", // field from the metadata collection
            as: "tx_metadata",
          },
        },
        {
          $match: {
            "tx_metadata.external_id": {
              $regex: externalIdPattern,
            },
          },
        },
        {
          $unwind: "$tx_metadata",
        },
        {
          $replaceRoot: { newRoot: { $mergeObjects: ["$$ROOT", "$tx_metadata"] } },
        },
      ])
    return results.map((tx) => translateToLedgerTxAndMetadata(tx))
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
