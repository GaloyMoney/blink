import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import { TxFilter } from "@domain/bitcoin/onchain"
import { AmountCalculator, ZERO_SATS } from "@domain/shared"
import { CouldNotFindError } from "@domain/errors"

import { WalletOnChainPendingReceiveRepository } from "@services/mongoose"
import { baseLogger } from "@services/logger"
import {
  IncomingOnChainTxHandler,
  NewIncomingOnChainTxHandler,
} from "@domain/bitcoin/onchain/incoming-tx-handler"

import { getOnChainTxs } from "./private/get-on-chain-txs"

const lndGetPendingOnChainBalanceForWallets = async (
  wallets: Wallet[],
): Promise<{ [key: WalletId]: BtcPaymentAmount } | ApplicationError> => {
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
  const balancesFromLnd = await lndGetPendingOnChainBalanceForWallets(wallets)
  if (balancesFromLnd instanceof Error) return balancesFromLnd

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
