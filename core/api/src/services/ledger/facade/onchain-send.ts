import { JournalNotFoundError } from "medici"

import { MainBook, Transaction } from "../books"

import { getBankOwnerWalletId, getNonEndUserWalletIds } from "../caching"
import {
  liabilitiesMainAccount,
  EntryBuilder,
  toLedgerAccountDescriptor,
} from "../domain"
import { NoTransactionToSettleError, UnknownLedgerError } from "../domain/errors"
import { persistAndReturnEntry, translateToLedgerJournal } from "../helpers"
import { TransactionsMetadataRepository } from "../services"

import { translateToLedgerTx } from ".."

import { isOnChainFeeReconciliationTxn } from "./onchain-reconcile"
import { staticAccountIds } from "./static-account-ids"

import {
  InvalidLedgerTransactionStateError,
  NoTransactionToUpdateError,
} from "@/domain/errors"
import { isValidObjectId, toObjectId } from "@/services/mongoose/utils"
import {
  BtcPaymentAmount,
  ErrorLevel,
  WalletCurrency,
  ZERO_CENTS,
  ZERO_SATS,
  paymentAmountFromNumber,
} from "@/domain/shared"
import { recordExceptionInCurrentSpan } from "@/services/tracing"

export const getTransactionsByPayoutId = async (
  payoutId: PayoutId,
): Promise<LedgerTransaction<WalletCurrency>[] | LedgerServiceError> => {
  try {
    const { results } = await MainBook.ledger({
      payout_id: payoutId,
      account: liabilitiesMainAccount,
    })
    /* eslint @typescript-eslint/ban-ts-comment: "off" */
    // @ts-ignore-next-line no-implicit-any error
    return results.map((tx) => translateToLedgerTx(tx))
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const recordSendOnChain = async ({
  description,
  senderWalletDescriptor,
  amountToDebitSender,
  bankFee,
  metadata,
  additionalDebitMetadata,
  additionalInternalMetadata,
}: RecordSendArgs) => {
  const actualFee = bankFee || { usd: ZERO_CENTS, btc: ZERO_SATS }
  const accountIds = await staticAccountIds()
  if (accountIds instanceof Error) return accountIds

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: accountIds,
    entry,
    metadata,
    additionalInternalMetadata,
  })

  entry = builder
    .withTotalAmount({
      usdWithFees: amountToDebitSender.usd,
      btcWithFees: amountToDebitSender.btc,
    })
    .withBankFee({ usdBankFee: actualFee.usd, btcBankFee: actualFee.btc })
    .debitAccount({
      accountDescriptor: toLedgerAccountDescriptor(senderWalletDescriptor),
      additionalMetadata: additionalDebitMetadata,
    })
    .creditOnChain()

  return persistAndReturnEntry({ entry, hash: metadata.hash })
}

export const setOnChainTxPayoutId = async ({
  journalId,
  payoutId,
}: SetOnChainTxPayoutIdArgs): Promise<true | LedgerServiceError> => {
  try {
    if (!isValidObjectId(journalId)) {
      return new NoTransactionToUpdateError()
    }

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

export const recordOnChainSendRevert = async ({
  journalId,
  payoutId,
}: SetOnChainTxPayoutIdArgs): Promise<true | LedgerServiceError> => {
  const reason = "Payment canceled"
  try {
    if (!isValidObjectId(journalId)) {
      return new NoTransactionToUpdateError(JSON.stringify({ journalId }))
    }

    const savedEntry = await MainBook.void(journalId, reason)

    const journalEntry = translateToLedgerJournal(savedEntry)
    const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
      id,
    }))
    await TransactionsMetadataRepository().persistAll(txsMetadataToPersist)

    return true
  } catch (err) {
    if (err instanceof JournalNotFoundError) {
      return new NoTransactionToUpdateError(JSON.stringify({ journalId, payoutId }))
    }

    return new UnknownLedgerError(err)
  }
}

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
      return new InvalidLedgerTransactionStateError(JSON.stringify({ txHashes }))
    }

    if (txHashes[0] !== txId)
      return new InvalidLedgerTransactionStateError(
        JSON.stringify({ persistedTxHash: txHashes[0], incomingTxId: txId }),
      )
  }

  const bankOwnerWalletId = await getBankOwnerWalletId()
  const bankOwnerTxns = txns.filter(
    (txn) => txn.walletId === bankOwnerWalletId && !isOnChainFeeReconciliationTxn(txn),
  )
  if (bankOwnerTxns.length !== 1) {
    recordExceptionInCurrentSpan({
      error: new InvalidLedgerTransactionStateError(),
      level: ErrorLevel.Critical,
      attributes: { txns: JSON.stringify(txns), payoutId },
      fallbackMsg: "InvalidLedgerTransactionStateError",
    })

    // cover the case when bankOwner is doing the transaction
    return { estimatedProtocolFee: BtcPaymentAmount(0n) }
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

export const settlePendingOnChainPayment = async (
  payoutId: PayoutId,
): Promise<LedgerTransaction<WalletCurrency> | undefined | LedgerServiceError> => {
  try {
    const result = await Transaction.updateMany(
      { payout_id: payoutId },
      { pending: false },
    )
    const success = result.modifiedCount > 0
    if (!success) {
      return new NoTransactionToSettleError()
    }
  } catch (err) {
    return new UnknownLedgerError(err)
  }

  const txns = await getTransactionsByPayoutId(payoutId)
  if (txns instanceof Error) return txns

  const nonUserWalletIds = Object.values(await getNonEndUserWalletIds())
  const userLedgerTxn = txns.find(
    (txn) => txn.walletId && !nonUserWalletIds.includes(txn.walletId),
  )

  if (userLedgerTxn === undefined && txns.length === 0) {
    return new InvalidLedgerTransactionStateError()
  }

  return userLedgerTxn
}
