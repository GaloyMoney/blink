import { CouldNotFindError, AuthorizationError } from "@domain/errors"
import { Permission, resourceIdFromWalletPublicId } from "@domain/authorization"
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

export const getLastOnChainAddressByWalletPublicId = async ({
  authorizationService,
  userId,
  walletPublicId,
}: {
  authorizationService: IAuthorizationService
  userId: UserId
  walletPublicId: WalletPublicId
}): Promise<OnChainAddress | ApplicationError> => {
  const authResult = await authorizationService.checkPermission({
    userId,
    resourceId: resourceIdFromWalletPublicId(walletPublicId),
    permission: Permission.WalletOnChainAddressCreate,
  })
  if (authResult instanceof Error) return authResult
  if (!authResult) return new AuthorizationError()
  const wallets = WalletsRepository()
  const wallet = await wallets.findByPublicId(walletPublicId)
  if (wallet instanceof Error) return wallet
  return getLastOnChainAddress(wallet.id)
}
