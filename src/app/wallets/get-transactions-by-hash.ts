import { LedgerService } from "@services/ledger"
import { WalletTransactionHistory } from "@domain/wallets"

export const getTransactionsByHash = async (
  hash: PaymentHash | OnChainTxHash,
): Promise<WalletTransactionWithMetadata[] | ApplicationError> => {
  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getTransactionsByHash(hash)
  if (ledgerTransactions instanceof Error) return ledgerTransactions
  return WalletTransactionHistory.fromLedgerWithMetadata(ledgerTransactions).transactions
}
