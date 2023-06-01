import { CouldNotFindError } from "@domain/errors"

import { WalletOnChainPendingReceiveRepository } from "@services/mongoose"
import { IncomingOnChainTxHandler } from "@domain/bitcoin/onchain/incoming-tx-handler"

export const getPendingOnChainBalanceForWallets = async <S extends WalletCurrency>(
  wallets: Wallet[],
): Promise<{ [key: WalletId]: PaymentAmount<S> } | ApplicationError> => {
  const pendingIncoming = await WalletOnChainPendingReceiveRepository().listByWalletIds({
    walletIds: wallets.map((wallet) => wallet.id),
  })
  if (pendingIncoming instanceof CouldNotFindError) return {}
  if (pendingIncoming instanceof Error) return pendingIncoming

  const incomingTxHandler = IncomingOnChainTxHandler<S>(pendingIncoming)
  if (incomingTxHandler instanceof Error) return incomingTxHandler

  return incomingTxHandler.balanceByWallet(wallets)
}
