import { createOnChainAddress } from "./create-on-chain-address"

import { AccountValidator } from "@/domain/accounts"
import { CouldNotFindError } from "@/domain/errors"
import {
  AccountsRepository,
  WalletOnChainAddressesRepository,
  WalletsRepository,
} from "@/services/mongoose"

export const getLastOnChainAddress = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError> => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet
  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account
  const accountValidator = AccountValidator(account)
  if (accountValidator instanceof Error) return accountValidator

  const onChainAddressesRepo = WalletOnChainAddressesRepository()
  const lastOnChainAddress = await onChainAddressesRepo.findLastByWalletId(walletId)

  if (lastOnChainAddress instanceof CouldNotFindError) {
    const requestId = walletId as unknown as OnChainAddressRequestId
    return createOnChainAddress({
      walletId,
      requestId,
    })
  }
  if (lastOnChainAddress instanceof Error) return lastOnChainAddress

  return lastOnChainAddress.address
}
