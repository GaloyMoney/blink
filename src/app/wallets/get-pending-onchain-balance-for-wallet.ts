import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import { TxFilter } from "@domain/bitcoin/onchain"
import { AmountCalculator, WalletCurrency, ZERO_SATS } from "@domain/shared"
import {
  CouldNotFindError,
  MultipleCurrenciesForSingleCurrencyOperationError,
} from "@domain/errors"

import { WalletOnChainPendingReceiveRepository } from "@services/mongoose"
import { baseLogger } from "@services/logger"
import {
  IncomingOnChainTxHandler,
  NewIncomingOnChainTxHandler,
} from "@domain/bitcoin/onchain/incoming-tx-handler"

import { getOnChainTxs } from "./private/get-on-chain-txs"

// Note: We have not turned on "create address" for stablesats wallets so
//       this function should only have to handle transactions for wallets
//       that are BTC-currency ones (no USD-wallet addresses should exist
//       in lnd).
const lndGetPendingOnChainBalanceForWallets = async (
  wallets: Wallet[],
): Promise<{ [key: WalletId]: BtcPaymentAmount } | ApplicationError> => {
  const walletCurrencies = new Set(wallets.map((w) => w.currency))
  if (!(walletCurrencies.size === 1 && walletCurrencies.has(WalletCurrency.Btc))) {
    return new MultipleCurrenciesForSingleCurrencyOperationError()
  }

  const onChainTxs = await getOnChainTxs()
  if (onChainTxs instanceof Error) {
    baseLogger.warn({ onChainTxs }, "impossible to get listIncomingTransactions")
    return onChainTxs
  }

  const filter = TxFilter({
    confirmationsLessThan: ONCHAIN_MIN_CONFIRMATIONS,
    addresses: wallets.flatMap((wallet) => wallet.onChainAddresses()),
  })
  const pendingIncoming = filter.apply(onChainTxs)

  return IncomingOnChainTxHandler(pendingIncoming).balanceByWallet(wallets)
}

const briaGetPendingOnChainBalanceForWallets = async <S extends WalletCurrency>(
  wallets: Wallet[],
): Promise<{ [key: WalletId]: PaymentAmount<S> } | ApplicationError> => {
  const pendingIncoming = await WalletOnChainPendingReceiveRepository().listByWalletIds({
    walletIds: wallets.map((wallet) => wallet.id),
  })
  if (pendingIncoming instanceof CouldNotFindError) return {}
  if (pendingIncoming instanceof Error) return pendingIncoming

  const incomingTxHandler = NewIncomingOnChainTxHandler<S>(pendingIncoming)
  if (incomingTxHandler instanceof Error) return incomingTxHandler

  return incomingTxHandler.balanceByWallet(wallets)
}

export const getPendingOnChainBalanceForWallets = async <S extends WalletCurrency>(
  wallets: Wallet[],
): Promise<{ [key: WalletId]: PaymentAmount<S> } | ApplicationError> => {
  const walletCurrencies = new Set(wallets.map((w) => w.currency))
  if (walletCurrencies.size !== 1) {
    return new MultipleCurrenciesForSingleCurrencyOperationError()
  }

  let balancesFromLnd: { [key: WalletId]: BtcPaymentAmount } = {}
  if (wallets[0].currency === WalletCurrency.Btc) {
    const result = await lndGetPendingOnChainBalanceForWallets(wallets)
    if (result instanceof Error) return result
    balancesFromLnd = result
  }
  const balancesFromBria = await briaGetPendingOnChainBalanceForWallets<S>(wallets)
  if (balancesFromBria instanceof Error) return balancesFromBria

  const walletIds = Array.from(
    new Set([...Object.keys(balancesFromLnd), ...Object.keys(balancesFromLnd)]),
  ) as WalletId[]

  return walletIds.reduce((obj, key) => {
    obj[key] = AmountCalculator().add(
      balancesFromBria[key] || ZERO_SATS,
      (balancesFromLnd[key] as PaymentAmount<S>) || ZERO_SATS,
    )
    return obj
  }, {} as { [key: WalletId]: PaymentAmount<S> })
}
