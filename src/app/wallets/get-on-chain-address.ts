import { OnChainService } from "@services/lnd/onchain-service"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { BTC_NETWORK } from "@config/app"
import { WalletsRepository } from "@services/mongoose"

export const getOnChainAddress = async (
  walletId: WalletId,
): Promise<OnChainAddressIdentifier | ApplicationError> => {
  const walletRepo = WalletsRepository()
  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const onChainAddress = await onChainService.createOnChainAddress()
  if (onChainAddress instanceof Error) return onChainAddress

  const savedOnChainAddress = await walletRepo.persistNewOnChainAddress(
    walletId,
    onChainAddress,
  )
  if (savedOnChainAddress instanceof Error) return savedOnChainAddress

  return savedOnChainAddress
}
