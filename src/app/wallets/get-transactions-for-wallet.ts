import { PartialResult } from "@app/partial-result"
import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"
import { TxFilter } from "@domain/bitcoin/onchain"
import { RepositoryError } from "@domain/errors"
import { LedgerError } from "@domain/ledger"
import { LedgerService } from "@services/ledger"
import { WalletsRepository } from "@services/mongoose"

import { filterTxs } from "./get-transactions-helpers"

// FIXME(nicolas): remove only used in tests
export const getTransactionsForWalletId = async ({
  walletId,
}: {
  walletId: WalletId
}): Promise<PartialResult<WalletTransaction[]>> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findById(walletId)
  if (wallet instanceof RepositoryError) return PartialResult.err(wallet)

  return getTransactionsForWallet(wallet)
}

export const getTransactionsForWallet = async (
  wallet: Wallet,
): Promise<PartialResult<WalletTransaction[]>> => {
  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getTransactionsByWalletId(wallet.id)
  if (ledgerTransactions instanceof LedgerError)
    return PartialResult.err(ledgerTransactions)

  const addresses = wallet.onChainAddresses()
  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses,
  })

  return filterTxs({
    walletId: wallet.id,
    addresses,
    ledgerTransactions,
    filter,
  })
}
