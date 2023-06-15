import { WalletCurrency, paymentAmountFromNumber } from "@domain/shared"
import {
  InvalidLedgerTransactionStateError,
  NoTransactionToUpdateError,
} from "@domain/errors"

import { toObjectId } from "@services/mongoose/utils"

import { getBankOwnerWalletId } from "../caching"
import { Transaction } from "../schema"
import { NoTransactionToSettleError, UnknownLedgerError } from "../domain/errors"
import { TransactionsMetadataRepository } from "../services"

import { getTransactionsByPayoutId } from "./get-txns"

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

export const setOnChainTxIdByPayoutId = async ({
  payoutId,
  txId,
  vout,
}: SetOnChainTxIdByPayoutIdArgs): Promise<
  { estimatedProtocolFee: BtcPaymentAmount } | LedgerServiceError
> => {
  let success: boolean
  try {
    const result = await Transaction.updateMany(
      { payout_id: payoutId },
      { hash: txId, vout },
    )
    success = result.modifiedCount > 0
  } catch (err) {
    return new UnknownLedgerError(err)
  }

  const txns = await getTransactionsByPayoutId(payoutId)
  if (txns instanceof Error) return txns

  if (!success) {
    if (txns.length === 0) return new NoTransactionToUpdateError(payoutId)

    const txHashes = txns.map((txn) => txn.txHash)
    if (new Set(txHashes).size !== 1) {
      return new InvalidLedgerTransactionStateError(`${txHashes}`)
    }

    if (txHashes[0] !== txId)
      return new InvalidLedgerTransactionStateError(
        `${{ persistedTxHash: txHashes[0], incomingTxId: txId }}`,
      )
  }

  const bankOwnerWalletId = await getBankOwnerWalletId()
  const bankOwnerTxns = txns.filter((txn) => txn.walletId === bankOwnerWalletId)
  if (bankOwnerTxns.length !== 1) {
    return new InvalidLedgerTransactionStateError(`payoutId: ${payoutId}`)
  }
  const bankOwnerTxn = bankOwnerTxns[0]
  const bankFee = bankOwnerTxn.credit
  const protocolFee = (bankOwnerTxn.satsFee || 0) - bankFee
  const estimatedProtocolFee = paymentAmountFromNumber({
    amount: protocolFee,
    currency: WalletCurrency.Btc,
  })
  if (estimatedProtocolFee instanceof Error) return estimatedProtocolFee

  return { estimatedProtocolFee }
}

export const setOnChainTxPayoutId = async ({
  journalId,
  payoutId,
}: SetOnChainTxPayoutIdArgs): Promise<true | LedgerServiceError> => {
  try {
    const result = await Transaction.updateMany(
      { _journal: toObjectId(journalId) },
      { payout_id: payoutId },
    )
    const success = result.modifiedCount > 0
    if (!success) {
      return new NoTransactionToUpdateError()
    }
    return true
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}
