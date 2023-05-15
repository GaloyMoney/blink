import { getDealerConfig, ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import { getCurrentPriceAsDisplayPriceRatio, getMidPriceRatio } from "@app/prices"
import { PartialResult } from "@app/partial-result"

import { LedgerError } from "@domain/ledger"
import { DisplayCurrency } from "@domain/fiat"
import { TxFilter } from "@domain/bitcoin/onchain"
import { WalletTransactionHistory } from "@domain/wallets"
import { CouldNotFindError } from "@domain/errors"

import { baseLogger } from "@services/logger"
import { getNonEndUserWalletIds, LedgerService } from "@services/ledger"
import {
  AccountsRepository,
  WalletOnChainPendingReceiveRepository,
} from "@services/mongoose"

import { WalletCurrency } from "@domain/shared"

import { getOnChainTxs } from "./private/get-on-chain-txs"

const usdHedgeEnabled = getDealerConfig().usd.hedgingEnabled

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

  const confirmedHistory = WalletTransactionHistory.fromLedger({
    ledgerTransactions: resp.slice,
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

  const addresses: OnChainAddress[] = []
  const addressesByWalletId: { [walletid: string]: OnChainAddress[] } = {}
  const walletDetailsByWalletId: WalletDetailsByWalletId = {}

  const accountRepo = AccountsRepository()
  for (const wallet of wallets) {
    const walletAddresses = wallet.onChainAddresses()
    addressesByWalletId[wallet.id] = walletAddresses
    addresses.push(...walletAddresses)

    const account = await accountRepo.findById(wallet.accountId)
    const depositFeeRatio =
      account instanceof Error ? (0 as DepositFeeRatio) : account.depositFeeRatio

    const displayCurrency =
      account instanceof Error ? DisplayCurrency.Usd : account.displayCurrency

    const displayPriceRatioForPending = await getCurrentPriceAsDisplayPriceRatio({
      currency: displayCurrency,
    })
    if (displayPriceRatioForPending instanceof Error) {
      return PartialResult.err(displayPriceRatioForPending)
    }

    let walletPriceRatio: WalletPriceRatio | undefined = undefined
    if (wallet.currency !== WalletCurrency.Btc) {
      const walletPriceRatioResult = await getMidPriceRatio(usdHedgeEnabled)
      if (walletPriceRatioResult instanceof Error) {
        return PartialResult.err(walletPriceRatioResult)
      }

      walletPriceRatio = walletPriceRatioResult
    }

    walletDetailsByWalletId[wallet.id] = {
      walletCurrency: wallet.currency,
      walletPriceRatio,
      depositFeeRatio,
      displayPriceRatio: displayPriceRatioForPending,
    }
  }

  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses,
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

export const newGetTransactionsForWallets = async ({
  wallets,
  paginationArgs,
}: {
  wallets: Wallet[]
  paginationArgs?: PaginationArgs
}): Promise<PartialResult<PaginatedArray<WalletTransaction>>> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  let pendingHistory = await WalletOnChainPendingReceiveRepository().listByWalletIds({
    walletIds,
  })
  if (pendingHistory instanceof Error) {
    if (pendingHistory instanceof CouldNotFindError) {
      pendingHistory = []
    } else {
      return PartialResult.err(pendingHistory)
    }
  }

  const confirmedLedgerTxns = await LedgerService().getTransactionsByWalletIds({
    walletIds,
    paginationArgs,
  })

  if (confirmedLedgerTxns instanceof LedgerError) {
    return PartialResult.partial(
      { slice: pendingHistory, total: pendingHistory.length },
      confirmedLedgerTxns,
    )
  }

  const confirmedHistory = WalletTransactionHistory.fromLedger({
    ledgerTransactions: confirmedLedgerTxns.slice,
    nonEndUserWalletIds: Object.values(await getNonEndUserWalletIds()),
  })

  const transactions = [...pendingHistory, ...confirmedHistory.transactions]

  return PartialResult.ok({
    slice: transactions,
    total: transactions.length,
  })
}
