import { UnknownLedgerError } from "./domain/errors"

import { TransactionsMetadataRepository } from "./services"

const txMetadataRepo = TransactionsMetadataRepository()

export const persistAndReturnEntry = async ({
  entry,
  hash,
  revealedPreImage,
}: {
  /* eslint @typescript-eslint/ban-ts-comment: "off" */
  // @ts-ignore-next-line no-implicit-any error
  entry
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

// @ts-ignore-next-line no-implicit-any error
export const translateToLedgerJournal = (savedEntry): LedgerJournal => ({
  journalId: savedEntry._id.toString(),
  voided: savedEntry.voided,
  // @ts-ignore-next-line no-implicit-any error
  transactionIds: savedEntry._transactions.map((id) => id.toString()),
})
