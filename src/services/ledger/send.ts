import { NoTransactionToUpdateError } from "@domain/errors"
import {
  LedgerServiceError,
  NoTransactionToSettleError,
  UnknownLedgerError,
} from "@domain/ledger/errors"

import { toObjectId } from "@services/mongoose/utils"

import { MainBook, Transaction } from "./books"

import { TransactionsMetadataRepository } from "./services"

import { translateToLedgerJournal } from "."

const txMetadataRepo = TransactionsMetadataRepository()

export const send = {
  setOnChainTxSendHash: async ({
    journalId,
    payoutId,
  }: SetOnChainTxSendHashArgs): Promise<true | LedgerServiceError> => {
    try {
      const result = await Transaction.updateMany(
        { _journal: toObjectId(journalId) },
        { hash: payoutId },
      )
      const success = result.modifiedCount > 0
      if (!success) {
        return new NoTransactionToUpdateError()
      }
      return true
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  setOnChainTxIdBySendHash: async ({
    payoutId,
    txId,
    vout,
  }: SetOnChainTxIdBySendHashArgs): Promise<true | LedgerServiceError> => {
    try {
      const result = await Transaction.updateMany(
        { hash: payoutId },
        { txid: txId, vout },
      )
      const success = result.modifiedCount > 0
      if (!success) {
        return new NoTransactionToUpdateError()
      }
      return true
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  settlePendingLnPayment: async (
    paymentHash: PaymentHash,
  ): Promise<true | LedgerServiceError> => {
    try {
      const result = await Transaction.updateMany(
        { hash: paymentHash },
        { pending: false },
      )
      const success = result.modifiedCount > 0
      if (!success) {
        return new NoTransactionToSettleError()
      }
      return true
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  settlePendingOnChainPayment: async (
    hash: PayoutId,
  ): Promise<true | LedgerServiceError> => {
    try {
      const result = await Transaction.updateMany({ hash }, { pending: false })
      const success = result.modifiedCount > 0
      if (!success) {
        return new NoTransactionToSettleError()
      }
      return true
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  revertLightningPayment: async ({
    journalId,
    paymentHash,
  }: RevertLightningPaymentArgs): Promise<true | LedgerServiceError> => {
    const reason = "Payment canceled"
    try {
      const savedEntry = await MainBook.void(journalId, reason)
      const journalEntry = translateToLedgerJournal(savedEntry)

      const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
        id,
        hash: paymentHash,
      }))
      txMetadataRepo.persistAll(txsMetadataToPersist)
      return true
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },

  revertOnChainPayment: async ({
    journalId,
    description = "Protocol error",
  }: RevertOnChainPaymentArgs): Promise<true | LedgerServiceError> => {
    try {
      // pending update must be before void to avoid pending voided records
      await Transaction.updateMany(
        { _journal: toObjectId(journalId) },
        { pending: false },
      )

      await MainBook.void(journalId, description)
      // TODO: persist to metadata
      return true
    } catch (err) {
      return new UnknownLedgerError(err)
    }
  },
}
