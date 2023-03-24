import { WalletTransactionHistory } from "@domain/wallets"

import { getNonEndUserWalletIds, LedgerService } from "@services/ledger"

export const getTransactionsByHash = async (
  hash: PaymentHash | OnChainTxHash,
): Promise<WalletTransaction<DisplayCurrency>[] | ApplicationError> => {
  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getTransactionsByHash(hash)
  if (ledgerTransactions instanceof Error) return ledgerTransactions
  return WalletTransactionHistory.fromLedger({
    ledgerTransactions,
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
  }).transactions
}
