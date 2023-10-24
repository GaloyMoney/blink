import { memoSharingConfig } from "@/config"
import { WalletTransactionHistory } from "@/domain/wallets"

import { getNonEndUserWalletIds, LedgerService } from "@/services/ledger"

export const getTransactionsForWalletByPaymentHash = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<WalletTransaction[] | ApplicationError> => {
  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getTransactionsForWalletByPaymentHash({
    walletId,
    paymentHash,
  })

  if (ledgerTransactions instanceof Error) return ledgerTransactions

  return WalletTransactionHistory.fromLedger({
    ledgerTransactions,
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
    memoSharingConfig,
  }).transactions
}

export const getTransactionsByHash = async (
  hash: PaymentHash | OnChainTxHash,
): Promise<WalletTransaction[] | ApplicationError> => {
  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getTransactionsByHash(hash)
  if (ledgerTransactions instanceof Error) return ledgerTransactions
  return WalletTransactionHistory.fromLedger({
    ledgerTransactions,
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
    memoSharingConfig,
  }).transactions
}
