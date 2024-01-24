import { AccountValidator } from "@domain/accounts"
import { CouldNotFindError } from "@domain/errors"
import {
  AccountsRepository,
  WalletOnChainAddressesRepository,
  WalletsRepository,
} from "@services/mongoose"

import { createOnChainAddress } from "./create-on-chain-address"
import { IbexEventError } from "@services/ibex/errors"

export const getLastOnChainAddress = async (
  walletId: WalletId,
): Promise<OnChainAddress | ApplicationError | IbexEventError> => {
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
    const ibexResp = await createOnChainAddress({
      walletId,
      requestId,
    })
    if (ibexResp instanceof Error) {
      return ibexResp
    }
    return ibexResp as OnChainAddress
  }
  if (lastOnChainAddress instanceof Error) return lastOnChainAddress

  return lastOnChainAddress.address
}
