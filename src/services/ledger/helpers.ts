import { Entry } from "medici"

import { UnknownLedgerError } from "./domain/errors"
import { TransactionsMetadataRepository } from "./services"

const txMetadataRepo = TransactionsMetadataRepository()

export const persistAndReturnEntry = async ({
  entry,
  hash,
}: {
  entry: Entry
  hash: PaymentHash
}) => {
  try {
    const savedEntry = await entry.commit()
    const journalEntry = translateToLedgerJournal(savedEntry)

    const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
      id,
      hash,
    }))
    txMetadataRepo.persistAll(txsMetadataToPersist)

    return journalEntry
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const translateToLedgerJournal = (savedEntry): LedgerJournal => ({
  journalId: savedEntry._id.toString(),
  voided: savedEntry.voided,
  transactionIds: savedEntry._transactions.map((id) => id.toString()),
})
