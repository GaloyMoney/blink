import { CouldNotFindError } from "@/domain/errors"

import { WalletOnChainPendingReceiveRepository } from "@/services/mongoose"

export const getPendingIncomingOnChainTransactionsForWallets = async ({
  wallets,
}: {
  wallets: Wallet[]
}): Promise<WalletOnChainSettledTransaction[] | ApplicationError> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  const pendingHistory = await WalletOnChainPendingReceiveRepository().listByWalletIds({
    walletIds,
  })

  if (pendingHistory instanceof CouldNotFindError) {
    return []
  }

  return pendingHistory
}
