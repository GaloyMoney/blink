import { LedgerService } from "@services/ledger"
import { toLiabilitiesAccountId, LedgerError } from "@domain/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { PartialResult } from "@app/partial-result"

export const getAccountTransactionsForContact = async ({
  account,
  contactWalletName,
}: {
  account: Account
  contactWalletName: WalletName
}): Promise<PartialResult<WalletTransaction[]>> => {
  const ledger = LedgerService()
  let transactions: WalletTransaction[] = []

  for (const walletId of account.walletIds) {
    const liabilitiesAccountId = toLiabilitiesAccountId(walletId)
    const ledgerTransactions = await ledger.getLiabilityTransactionsForContactWalletName(
      liabilitiesAccountId,
      contactWalletName,
    )
    if (ledgerTransactions instanceof LedgerError)
      return PartialResult.err(ledgerTransactions)

    const confirmedHistory = WalletTransactionHistory.fromLedger(ledgerTransactions)
    transactions = transactions.concat(confirmedHistory.transactions)
  }

  return PartialResult.ok(transactions)
}
