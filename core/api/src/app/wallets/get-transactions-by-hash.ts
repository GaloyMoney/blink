import { memoSharingConfig } from "@/config"
import { WalletTransactionHistory } from "@/domain/wallets"

import { getNonEndUserWalletIds, LedgerService } from "@/services/ledger"

export const getTransactionForWalletByPaymentHash = async ({
  walletId,
  paymentHash,
}: {
  walletId: WalletId
  paymentHash: PaymentHash
}): Promise<WalletTransaction | undefined | ApplicationError> => {
  const ledger = LedgerService()
  const ledgerTransaction = await ledger.getTransactionForWalletByPaymentHash({
    walletId,
    paymentHash,
  })

  if (ledgerTransaction instanceof Error) return ledgerTransaction

  return WalletTransactionHistory.fromLedger({
    ledgerTransactions: [ledgerTransaction],
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
    memoSharingConfig,
  }).transactions[0]
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
