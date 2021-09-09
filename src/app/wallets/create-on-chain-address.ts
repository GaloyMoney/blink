import { OnChainService } from "@services/lnd/onchain-service"
import { TxDecoder } from "@domain/bitcoin/onchain"
import { BTC_NETWORK } from "@config/app"
import { WalletOnChainAddressesRepository, WalletsRepository } from "@services/mongoose"

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

export const createOnChainAddressByWalletName = async (
  walletName: WalletName,
): Promise<OnChainAddress | ApplicationError> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findByWalletName(walletName)
  if (wallet instanceof Error) return wallet
  return createOnChainAddress(wallet.id)
}
