import { AccountValidator } from "@/domain/accounts"
import { OnChainAddressNotFoundError } from "@/domain/bitcoin/onchain"
import { RateLimitConfig } from "@/domain/rate-limit"
import { RateLimiterExceededError } from "@/domain/rate-limit/errors"

import { OnChainService } from "@/services/bria"
import {
  AccountsRepository,
  WalletOnChainAddressesRepository,
  WalletsRepository,
} from "@/services/mongoose"
import { consumeLimiter } from "@/services/rate-limit"

export const createOnChainAddress = async ({
  walletId,
  requestId,
}: {
  walletId: WalletId
  requestId?: OnChainAddressRequestId
}) => {
  const wallet = await WalletsRepository().findById(walletId)
  if (wallet instanceof Error) return wallet
  const account = await AccountsRepository().findById(wallet.accountId)
  if (account instanceof Error) return account

  const accountValidator = AccountValidator(account)
  if (accountValidator instanceof Error) return accountValidator

  const onChain = OnChainService()

  let onChainAddress: OnChainAddressIdentifier | undefined = undefined
  if (requestId) {
    const foundAddress = await onChain.findAddressByRequestId(requestId)
    if (
      foundAddress instanceof Error &&
      !(foundAddress instanceof OnChainAddressNotFoundError)
    ) {
      return foundAddress
    }

    if (!(foundAddress instanceof OnChainAddressNotFoundError)) {
      onChainAddress = foundAddress
    }
  }

  if (onChainAddress === undefined) {
    const limitOk = await checkOnChainAddressAccountIdLimits(wallet.accountId)
    if (limitOk instanceof Error) return limitOk

    const newOnChainAddress = await onChain.getAddressForWallet({
      walletDescriptor: {
        id: wallet.id,
        currency: wallet.currency,
        accountId: wallet.accountId,
      },
      requestId,
    })
    if (newOnChainAddress instanceof Error) return newOnChainAddress
    onChainAddress = newOnChainAddress
  }

  const onChainAddressesRepo = WalletOnChainAddressesRepository()

  const addressRecorded = await onChainAddressesRepo.isRecorded({
    walletId,
    onChainAddress,
  })
  if (addressRecorded instanceof Error) return addressRecorded

  if (!addressRecorded) {
    const savedOnChainAddress = await onChainAddressesRepo.persistNew({
      walletId,
      onChainAddress,
    })
    if (savedOnChainAddress instanceof Error) return savedOnChainAddress
  }

  return onChainAddress.address
}

const checkOnChainAddressAccountIdLimits = async (
  accountId: AccountId,
): Promise<true | RateLimiterExceededError> =>
  consumeLimiter({
    rateLimitConfig: RateLimitConfig.onChainAddressCreate,
    keyToConsume: accountId,
  })
