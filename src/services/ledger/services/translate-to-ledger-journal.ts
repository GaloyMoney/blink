// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-next-line no-implicit-any error
export const translateToLedgerJournal = (savedEntry): LedgerJournal => ({
  journalId: savedEntry._id.toString(),
  voided: savedEntry.voided,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore-next-line no-implicit-any error
  transactionIds: savedEntry._transactions.map((id) => id.toString()),
})
