import { CouldNotFindError } from "@/domain/errors"

import { WalletOnChainPendingReceiveRepository } from "@/services/mongoose"

export const getPendingIncomingOnChainTransactionsForWalletsByAddresses = async ({
  wallets,
  addresses,
}: {
  wallets: Wallet[]
  addresses: OnChainAddress[]
}): Promise<WalletOnChainSettledTransaction[] | ApplicationError> => {
  const walletIds = wallets.map((wallet) => wallet.id)

  const pendingHistory =
    await WalletOnChainPendingReceiveRepository().listByWalletIdsAndAddresses({
      walletIds,
      addresses,
    })

  if (pendingHistory instanceof CouldNotFindError) {
    return []
  }

  return pendingHistory
}
