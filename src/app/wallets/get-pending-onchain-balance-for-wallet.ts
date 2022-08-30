import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import { TxFilter } from "@domain/bitcoin/onchain"

import { baseLogger } from "@services/logger"
import { IncomingOnChainTxHandler } from "@domain/bitcoin/onchain/incoming-tx-handler"

import getOnChainTxs from "./get-on-chain-txs"

export const getPendingOnChainBalanceForWallet = async (
  wallets: Wallet[],
): Promise<{ [key: WalletId]: CurrencyBaseAmount } | ApplicationError> => {
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

  const balancesByWallet =
    IncomingOnChainTxHandler(pendingIncoming).balanceByWallet(wallets)
  if (balancesByWallet instanceof Error) return balancesByWallet

  const normalizedBalances = {} as { [key: WalletId]: CurrencyBaseAmount }
  for (const key of Object.keys(balancesByWallet)) {
    const walletId = key as WalletId
    const balance = Number(balancesByWallet[walletId]) as CurrencyBaseAmount
    normalizedBalances[walletId] = balance
  }
  return normalizedBalances
}
