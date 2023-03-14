import { getDealerConfig, ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import { getCurrentPriceAsDisplayPriceRatio, getMidPriceRatio } from "@app/prices"
import { PartialResult } from "@app/partial-result"

import { LedgerError } from "@domain/ledger"
import { DisplayCurrency } from "@domain/fiat"
import { TxFilter } from "@domain/bitcoin/onchain"
import { WalletTransactionHistory } from "@domain/wallets"

import { baseLogger } from "@services/logger"
import { getNonEndUserWalletIds, LedgerService } from "@services/ledger"
import { AccountsRepository } from "@services/mongoose"

import { WalletPriceRatio } from "@domain/payments"
import { WalletCurrency } from "@domain/shared"

import { getOnChainTxs } from "./private/get-on-chain-txs"

const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

export const getTransactionsForWalletsByAddresses = async <
  S extends WalletCurrency,
  T extends DisplayCurrency,
>({
  wallets,
  addresses,
  paginationArgs,
}: {
  wallets: Wallet[]
  addresses: OnChainAddress[]
  paginationArgs?: PaginationArgs
}): Promise<PartialResult<PaginatedArray<WalletTransaction>>> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  const ledger = LedgerService()
  const resp = await ledger.getTransactionsByWalletIds({
    walletIds,
    paginationArgs,
  })
  if (resp instanceof LedgerError) return PartialResult.err(resp)
  const ledgerTransactions = resp.slice.filter(
    (tx) => tx.address && addresses.includes(tx.address),
  )

  const confirmedHistory = WalletTransactionHistory.fromLedger({
    ledgerTransactions,
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
  })

  const onChainTxs = await getOnChainTxs()
  if (onChainTxs instanceof Error) {
    baseLogger.warn({ onChainTxs }, "impossible to get listIncomingTransactions")
    return PartialResult.partial(
      { slice: confirmedHistory.transactions, total: resp.total },
      onChainTxs,
    )
  }

  const allAddresses: OnChainAddress[] = []
  const addressesByWalletId: { [walletid: string]: OnChainAddress[] } = {}
  const walletDetailsByWalletId: WalletDetailsByWalletId<S, T> = {}

  const accountRepo = AccountsRepository()
  for (const wallet of wallets) {
    const walletAddresses = wallet.onChainAddresses()
    addressesByWalletId[wallet.id] = walletAddresses
    allAddresses.push(...walletAddresses)

    const account = await accountRepo.findById(wallet.accountId)
    const depositFeeRatio =
      account instanceof Error ? (0 as DepositFeeRatio) : account.depositFeeRatio

    const displayCurrency =
      account instanceof Error
        ? (DisplayCurrency.Usd as T)
        : (account.displayCurrency as T)

    let displayPriceRatioForPending:
      | DisplayPriceRatio<"BTC", T>
      | PriceServiceError
      | undefined = await getCurrentPriceAsDisplayPriceRatio<T>({
      currency: displayCurrency,
    })
    if (displayPriceRatioForPending instanceof Error) {
      displayPriceRatioForPending = undefined
    }

    let walletPriceRatio = WalletPriceRatio({
      usd: { amount: 1n, currency: WalletCurrency.Usd },
      btc: { amount: 1n, currency: WalletCurrency.Btc },
    })
    if (walletPriceRatio instanceof Error) {
      return PartialResult.err(walletPriceRatio)
    }
    if (wallet.currency !== WalletCurrency.Btc) {
      const walletPriceRatioResult = await getMidPriceRatio(usdHedgeEnabled)
      if (walletPriceRatioResult instanceof Error) {
        return PartialResult.err(walletPriceRatioResult)
      }

      walletPriceRatio = walletPriceRatioResult
    }

    walletDetailsByWalletId[wallet.id] = {
      walletCurrency: wallet.currency as S,
      walletPriceRatio,
      depositFeeRatio,
      displayCurrency,
      displayPriceRatio: displayPriceRatioForPending,
    }
  }
  const addressesForWallets = addresses.filter((address) =>
    allAddresses.includes(address),
  )

  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses: addressesForWallets,
  })

  const pendingIncoming = filter.apply(onChainTxs)

  return PartialResult.ok({
    slice: confirmedHistory.addPendingIncoming({
      pendingIncoming,
      addressesByWalletId,
      walletDetailsByWalletId,
    }).transactions,
    total: resp.total,
  })
}
