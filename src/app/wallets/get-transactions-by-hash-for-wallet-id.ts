import { PartialResult } from "@app/partial-result"
import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"
import { TxFilter } from "@domain/bitcoin/onchain"
import { LedgerError } from "@domain/ledger"
import { LedgerService } from "@services/ledger"
import { WalletsRepository } from "@services/mongoose"

import { filterTxs } from "./get-transactions-helpers"

export const getTransactionsByHashForWalletId = async ({
  walletId,
  hash,
}: {
  walletId: WalletId
  hash: PaymentHash | OnChainTxHash
}): Promise<PartialResult<WalletTransaction[]>> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return PartialResult.err(wallet)

  const ledger = LedgerService()
  const ledgerTransactions = await ledger.getTransactionsByWalletIdAndHash({
    walletId: wallet.id,
    hash,
  })
  if (ledgerTransactions instanceof LedgerError)
    return PartialResult.err(ledgerTransactions)

  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    hash: hash as OnChainTxHash,
  })

  return filterTxs({
    walletId: wallet.id,
    addresses: wallet.onChainAddresses(),
    ledgerTransactions,
    filter,
  })
}
