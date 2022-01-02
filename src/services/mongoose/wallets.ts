import {
  CouldNotFindWalletFromIdError,
  CouldNotFindWalletFromOnChainAddressError,
  CouldNotFindWalletFromOnChainAddressesError,
  CouldNotFindWalletFromUsernameError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"

import { caseInsensitiveRegex } from "./users"

export const WalletsRepository = (): IWalletsRepository => {
  const findById = async (walletId: WalletId): Promise<Wallet | RepositoryError> => {
    try {
      const result = await User.findOne({ walletId }, projection)
      if (!result) {
        return new CouldNotFindWalletFromIdError()
      }
      return resultToWallet(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByUsername = async (
    username: Username,
  ): Promise<Wallet | RepositoryError> => {
    try {
      const result = await User.findOne(
        { username: caseInsensitiveRegex(username) },
        projection,
      )
      if (!result) {
        return new CouldNotFindWalletFromUsernameError()
      }

      return resultToWallet(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByAddress = async (
    address: OnChainAddress,
  ): Promise<Wallet | RepositoryError> => {
    try {
      const result = await User.findOne({ "onchain.address": address }, projection)
      if (!result) {
        return new CouldNotFindWalletFromOnChainAddressError()
      }
      return resultToWallet(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const listByAddresses = async (
    addresses: string[],
  ): Promise<Wallet[] | RepositoryError> => {
    try {
      const result = await User.find(
        { "onchain.address": { $in: addresses } },
        projection,
      )
      if (!result) {
        return new CouldNotFindWalletFromOnChainAddressesError()
      }
      return result.map(resultToWallet)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findById,
    findByAddress,
    findByUsername,
    listByAddresses,
  }
}

const resultToWallet = (result: UserType): Wallet => {
  const walletId = result.walletId as WalletId
  const depositFeeRatio = result.depositFeeRatio as DepositFeeRatio
  const withdrawFee = result.withdrawFee as WithdrawFee

  const onChainAddressIdentifiers = result.onchain.map(({ pubkey, address }) => {
    return {
      pubkey: pubkey as Pubkey,
      address: address as OnChainAddress,
    }
  })
  const onChainAddresses = () => onChainAddressIdentifiers.map(({ address }) => address)

  return {
    id: walletId,
    depositFeeRatio,
    withdrawFee,
    onChainAddressIdentifiers,
    onChainAddresses,
  }
}
const projection = {
  walletId: 1,
  depositFeeRatio: 1,
  withdrawFee: 1,
  onchain: 1,
}
