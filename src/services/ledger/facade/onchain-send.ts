import {
  WalletCurrency,
  ZERO_CENTS,
  ZERO_SATS,
  paymentAmountFromNumber,
} from "@domain/shared"

import {
  InvalidLedgerTransactionStateError,
  NoTransactionToUpdateError,
} from "@domain/errors"

import { toObjectId } from "@services/mongoose/utils"

import { MainBook, Transaction } from "../books"

import { getBankOwnerWalletId, getNonEndUserWalletIds } from "../caching"
import {
  liabilitiesMainAccount,
  EntryBuilder,
  toLedgerAccountDescriptor,
} from "../domain"
import { NoTransactionToSettleError, UnknownLedgerError } from "../domain/errors"
import { persistAndReturnEntry } from "../helpers"

import { translateToLedgerTx } from ".."

import { staticAccountIds } from "./shared"

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

  let entry = MainBook.entry(description)
  const builder = EntryBuilder({
    staticAccountIds: await staticAccountIds(),
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

export const settlePendingOnChainPayment = async (
  payoutId: PayoutId,
): Promise<LedgerTransaction<WalletCurrency> | LedgerServiceError> => {
  try {
    const result = await Transaction.updateMany({ payoutId }, { pending: false })
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

  if (userLedgerTxn === undefined) return new InvalidLedgerTransactionStateError()

  return userLedgerTxn
}
