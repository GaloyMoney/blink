import { Entry, IJournal } from "medici"

import { UnknownLedgerError } from "./domain/errors"

import { TransactionsMetadataRepository } from "./services"

const txMetadataRepo = TransactionsMetadataRepository()

export const persistAndReturnEntry = async ({
  entry,
  hash,
  revealedPreImage,
}: {
  entry: Entry<ILedgerTransaction, IJournal>
  hash?: PaymentHash | OnChainTxHash
  revealedPreImage?: RevealedPreImage
}) => {
  try {
    const savedEntry = await entry.commit()
    const journalEntry = translateToLedgerJournal(savedEntry)

    const txsMetadataToPersist = journalEntry.transactionIds.map((id) => ({
      id,
      hash,
      revealedPreImage,
    }))
    txMetadataRepo.persistAll(txsMetadataToPersist)

    return journalEntry
  } catch (err) {
    return new UnknownLedgerError(err)
  }
}

export const translateToLedgerJournal = (
  savedEntry: Awaited<ReturnType<Entry<ILedgerTransaction, IJournal>["commit"]>>,
): LedgerJournal => ({
  journalId: savedEntry._id.toString() as LedgerJournalId,
  voided: !!savedEntry.voided,
  transactionIds: savedEntry._transactions.map(
    (id) => id.toString() as LedgerTransactionId,
  ),
})
