import { CouldNotFindError } from "@domain/errors"
import { WalletsRepository, WalletOnChainAddressesRepository } from "@services/mongoose"
import { createOnChainAddress } from "./create-on-chain-address"

export const getLastOnChainAddress = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const onChainAddressesRepo = WalletOnChainAddressesRepository()
  const lastOnChainAddress = await onChainAddressesRepo.findLastByWalletId(walletId)

  if (lastOnChainAddress instanceof CouldNotFindError)
    return createOnChainAddress(walletId)

  if (lastOnChainAddress instanceof Error) return lastOnChainAddress

  return lastOnChainAddress.address
}

export const getLastOnChainAddressByWalletName = async (
  walletName: WalletName,
): Promise<OnChainAddress | ApplicationError> => {
  const wallets = WalletsRepository()
  const wallet = await wallets.findByWalletName(walletName)
  if (wallet instanceof Error) return wallet
  return getLastOnChainAddress(wallet.id)
}
