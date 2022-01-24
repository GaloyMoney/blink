import { BTC_NETWORK } from "@config"
import { checkedToSats, checkedToTargetConfs } from "@domain/bitcoin"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { ColdStorageService } from "@services/cold-storage"
import { OnChainService } from "@services/lnd/onchain-service"

export const rebalanceToHotWallet = async ({
  walletName,
  amount,
  targetConfirmations,
}: RebalanceToHotWalletArgs): Promise<ColdStoragePsbt | ApplicationError> => {
  const checkedAmount = checkedToSats(amount)
  if (checkedAmount instanceof Error) return checkedAmount

  const targetConfs = checkedToTargetConfs(targetConfirmations)
  if (targetConfs instanceof Error) return targetConfs

  const coldStorageService = await ColdStorageService()
  if (coldStorageService instanceof Error) return coldStorageService

  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const onChainAddress = await onChainService.createOnChainAddress()
  if (onChainAddress instanceof Error) return onChainAddress

  return coldStorageService.createPsbt({
    walletName,
    amount: checkedAmount,
    onChainAddress: onChainAddress.address,
    targetConfirmations: targetConfs,
  })
}
