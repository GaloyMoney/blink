import { LedgerServiceError, UnknownLedgerError } from "@domain/ledger/errors"

import { toObjectId } from "@services/mongoose/utils"

import { MainBook, Transaction } from "./books"

import { TransactionsMetadataRepository } from "./services"

import { translateToLedgerJournal } from "./helpers"

const txMetadataRepo = TransactionsMetadataRepository()

export const send = {
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
      if (err instanceof Error) return new UnknownLedgerError(err.message)
      return new UnknownLedgerError()
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
      if (err instanceof Error) return new UnknownLedgerError(err.message)
      return new UnknownLedgerError()
    }
  },
}
