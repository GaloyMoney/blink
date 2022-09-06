import { ONCHAIN_MIN_CONFIRMATIONS } from "@config"

import { TxFilter } from "@domain/bitcoin/onchain"

import { baseLogger } from "@services/logger"
import { IncomingOnChainTxHandler } from "@domain/bitcoin/onchain/incoming-tx-handler"

import { getOnChainTxs } from "./private/get-on-chain-txs"

export const getPendingOnChainBalanceForWallets = async (
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
