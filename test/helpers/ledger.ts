import mongoose from "mongoose"

import { toObjectId } from "@services/mongoose/utils"
import { MainBook } from "@services/ledger/books"

const Journal = mongoose.models.Medici_Journal
const Transaction = mongoose.models.Medici_Transaction

export const markFailedTransactionAsPending = async (id: LedgerJournalId) => {
  const journalIdAsObject = toObjectId<LedgerJournalId>(id)

  // Step 1: Fetch transaction and confirm voided
  // ===
  const { results: journalTxns } = await MainBook.ledger({
    _journal: journalIdAsObject,
  })
  if (!(journalTxns && journalTxns.length > 0)) {
    throw new Error("No transactions found for journalId")
  }
  expect(journalTxns[0]).toHaveProperty("voided")
  expect(journalTxns[0]).toHaveProperty("void_reason")

  // Step 2: Fetch canceling transactions by "original_journal"
  // ===
  const { results: cancelJournalTxns } = await MainBook.ledger({
    _original_journal: journalIdAsObject,
  })
  if (!(cancelJournalTxns && cancelJournalTxns.length > 0)) {
    throw new Error("No canceled counter-transactions found")
  }
  const voidJournalIdAsObject = cancelJournalTxns[0]._journal

  // Step 3: Get original journal Id and delete journal + entries
  // ===
  await Transaction.deleteMany({
    _journal: voidJournalIdAsObject,
  })

  await Journal.deleteOne({
    _id: voidJournalIdAsObject,
  })

  // Step 4: Remove voided status from original txns/journal, and mark original txns as pending
  // ===
  await Transaction.updateMany(
    { _journal: journalIdAsObject },
    { pending: true, $unset: { voided: 1, void_reason: 1 } },
  )

  await Journal.updateMany(
    { _id: journalIdAsObject },
    { $unset: { voided: 1, void_reason: 1 } },
  )
}

export const markSuccessfulTransactionAsPending = async (id: LedgerJournalId) => {
  const journalIdAsObject = toObjectId<LedgerJournalId>(id)

  // Step 1: Fetch transaction and confirm not voided
  const { results: journalTxns } = await MainBook.ledger({
    _journal: journalIdAsObject,
  })
  if (!(journalTxns && journalTxns.length > 0)) {
    throw new Error("No transactions found for journalId")
  }
  expect(journalTxns[0]).not.toHaveProperty("voided")
  expect(journalTxns[0]).not.toHaveProperty("void_reason")

  // Step 2: Mark original txns as pending
  await Transaction.updateMany({ _journal: journalIdAsObject }, { pending: true })
}
