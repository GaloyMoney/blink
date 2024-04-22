import { CouldNotFindWalletOnChainPendingReceiveError } from "@/domain/errors"
import {
  WalletOnChainPendingReceiveRepository,
  WalletsRepository,
} from "@/services/mongoose"

export const removePendingTransaction = async ({
  txId,
  vout,
  address,
}: {
  txId: OnChainTxHash
  vout: OnChainTxVout
  address: OnChainAddress
}): Promise<true | ApplicationError> => {
  const wallet = await WalletsRepository().findByAddress(address)
  if (wallet instanceof Error) return wallet

  const res = await WalletOnChainPendingReceiveRepository().remove({
    walletId: wallet.id,
    transactionHash: txId,
    vout,
  })
  if (res instanceof CouldNotFindWalletOnChainPendingReceiveError) {
    return true
  }

  if (res instanceof Error) {
    return res
  }

  return true
}
