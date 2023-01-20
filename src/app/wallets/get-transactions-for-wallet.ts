import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import { getCurrentPrice } from "@app/prices"
import { PartialResult } from "@app/partial-result"

import { LedgerError } from "@domain/ledger"
import { DisplayCurrency } from "@domain/fiat"
import { TxFilter } from "@domain/bitcoin/onchain"
import { WalletTransactionHistory } from "@domain/wallets"

import { baseLogger } from "@services/logger"
import { LedgerService } from "@services/ledger"
import { AccountsRepository } from "@services/mongoose"

import { getOnChainTxs } from "./private/get-on-chain-txs"

export const getTransactionsForWallets = async ({
  wallets,
  paginationArgs,
}: {
  wallets: Wallet[]
  paginationArgs?: PaginationArgs
}): Promise<PartialResult<PaginatedArray<WalletTransaction>>> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  const ledger = LedgerService()
  const resp = await ledger.getTransactionsByWalletIds({
    walletIds,
    paginationArgs,
  })

  if (resp instanceof LedgerError) return PartialResult.err(resp)

  const confirmedHistory = WalletTransactionHistory.fromLedger(resp.slice)

  const onChainTxs = await getOnChainTxs()
  if (onChainTxs instanceof Error) {
    baseLogger.warn({ onChainTxs }, "impossible to get listIncomingTransactions")
    return PartialResult.partial(
      { slice: confirmedHistory.transactions, total: resp.total },
      onChainTxs,
    )
  }

  const addresses: OnChainAddress[] = []
  const addressesByWalletId: { [walletid: string]: OnChainAddress[] } = {}
  const walletDetailsByWalletId: {
    [walletid: string]: { currency: WalletCurrency; depositFeeRatio: DepositFeeRatio }
  } = {}

  const accountRepo = AccountsRepository()
  for (const wallet of wallets) {
    const walletAddresses = wallet.onChainAddresses()
    addressesByWalletId[wallet.id] = walletAddresses
    addresses.push(...walletAddresses)

    const account = await accountRepo.findById(wallet.accountId)
    const depositFeeRatio =
      account instanceof Error ? (0 as DepositFeeRatio) : account.depositFeeRatio
    walletDetailsByWalletId[wallet.id] = { currency: wallet.currency, depositFeeRatio }
  }

  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses,
  })

  const pendingIncoming = filter.apply(onChainTxs)

  let price = await getCurrentPrice({ currency: DisplayCurrency.Usd })
  if (price instanceof Error) {
    price = NaN as DisplayCurrencyPerSat
  }

  return PartialResult.ok({
    slice: confirmedHistory.addPendingIncoming({
      pendingIncoming,
      addressesByWalletId,
      walletDetailsByWalletId,
      displayCurrencyPerSat: price,
    }).transactions,
    total: resp.total,
  })
}
