import { LedgerService } from "@services/ledger"
import { WalletTransactionHistory } from "@domain/wallets"
import { checkedToLedgerTransactionId } from "@domain/ledger"

export const getTransactionById = async (
  id: string,
): Promise<WalletTransaction | ApplicationError> => {
  const ledger = LedgerService()

  const ledgerTxId = checkedToLedgerTransactionId(id)
  if (ledgerTxId instanceof Error) return ledgerTxId

  const ledgerTransaction = await ledger.getTransactionById(ledgerTxId)
  if (ledgerTransaction instanceof Error) return ledgerTransaction

  return WalletTransactionHistory.fromLedger([ledgerTransaction]).transactions[0]
}
