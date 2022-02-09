interface ITransactionMetadataRepository {
  persistNew()
  update()
  listByJournalId()
  listByJournalIds()
}
