import { TransactionsMetadataRepository } from "@/services/ledger/services"

export const getTransactionsMetadataByIds = async (
  ids: LedgerTransactionId[],
): Promise<(LedgerTransactionMetadata | RepositoryError)[] | ApplicationError> =>
  TransactionsMetadataRepository().listByIds(ids)
