import {
  CouldNotFindError,
  MultipleCurrenciesForSingleCurrencyOperationError,
} from "@/domain/errors"

import { WalletOnChainPendingReceiveRepository } from "@/services/mongoose"
import { IncomingOnChainTxHandler } from "@/domain/bitcoin/onchain/incoming-tx-handler"
import { WalletCurrency, ZERO_CENTS, ZERO_SATS } from "@/domain/shared"

export const getPendingIncomingOnChainBalanceForWallets = async <
  S extends WalletCurrency,
>(
  wallets: Wallet[],
): Promise<{ [key: WalletId]: PaymentAmount<S> } | ApplicationError> => {
  const pendingIncoming = await WalletOnChainPendingReceiveRepository().listByWalletIds({
    walletIds: wallets.map((wallet) => wallet.id),
  })

  if (pendingIncoming instanceof CouldNotFindError) {
    const settlementCurrencies = new Set(wallets.map((wallet) => wallet.currency))
    if (settlementCurrencies.size !== 1) {
      return new MultipleCurrenciesForSingleCurrencyOperationError()
    }
    const zeroAmount =
      wallets[0].currency === WalletCurrency.Btc
        ? (ZERO_SATS as PaymentAmount<S>)
        : (ZERO_CENTS as PaymentAmount<S>)

    const balanceByWalletId: { [key: WalletId]: PaymentAmount<S> } = {}
    for (const wallet of wallets) {
      balanceByWalletId[wallet.id] = zeroAmount
    }
    return balanceByWalletId
  }
  if (pendingIncoming instanceof Error) return pendingIncoming

  const incomingTxHandler = IncomingOnChainTxHandler<S>(pendingIncoming)
  if (incomingTxHandler instanceof Error) return incomingTxHandler

  return incomingTxHandler.balanceByWallet(wallets)
}
