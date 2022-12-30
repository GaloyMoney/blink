import { CouldNotFindError } from "@domain/errors"
import { WalletOnChainAddressesRepository } from "@services/mongoose"

import { createOnChainAddressForBtcWallet } from "./create-on-chain-address"

export const getLastOnChainAddressForBtcWallet = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const onChainAddressesRepo = WalletOnChainAddressesRepository()
  const lastOnChainAddress = await onChainAddressesRepo.findLastByWalletId(walletId)

  if (lastOnChainAddress instanceof CouldNotFindError)
    return createOnChainAddressForBtcWallet(walletId)

  if (lastOnChainAddress instanceof Error) return lastOnChainAddress

  return lastOnChainAddress.address
}
