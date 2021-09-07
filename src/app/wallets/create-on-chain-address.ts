import { OnChainService } from "@services/lnd/onchain-service"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { BTC_NETWORK } from "@config/app"
import { WalletOnChainAddressesRepository } from "@services/mongoose"

export const createOnChainAddress = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const onChainService = OnChainService(TxDecoder(BTC_NETWORK))
  if (onChainService instanceof Error) return onChainService

  const onChainAddress = await onChainService.createOnChainAddress()
  if (onChainAddress instanceof Error) return onChainAddress

  const onChainAddressesRepo = WalletOnChainAddressesRepository()
  const savedOnChainAddress = await onChainAddressesRepo.persistNew(
    walletId,
    onChainAddress,
  )
  if (savedOnChainAddress instanceof Error) return savedOnChainAddress

  return savedOnChainAddress.address
}
