import { WalletOnChainAddressesRepository } from "@services/mongoose"
import { createOnChainAddress } from "./create-on-chain-address"

export const getLastOnChainAddress = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const onChainAddressesRepo = WalletOnChainAddressesRepository()
  const lastOnChainAddress = await onChainAddressesRepo.findLastByWalletId(walletId)

  if (lastOnChainAddress instanceof Error) return createOnChainAddress(walletId)

  return lastOnChainAddress.address
}
