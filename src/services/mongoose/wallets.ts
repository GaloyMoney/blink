import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"
import { caseInsensitiveRegex } from "./users"

export const WalletsRepository = (): IWalletsRepository => {
  const findById = async (walletId: WalletId): Promise<Wallet | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: walletId })
      if (!result) {
        return new CouldNotFindError()
      }
      return resultToWallet(result)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const findByWalletName = async (
    username: WalletName,
  ): Promise<Wallet | RepositoryError> => {
    try {
      const result = await User.findOne({ username: caseInsensitiveRegex(username) })
      if (!result) {
        return new CouldNotFindError()
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
      const result = await User.findOne({ "onchain.address": address })
      if (!result) {
        return new CouldNotFindError()
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
      const result = await User.find({ "onchain.address": { $in: addresses } })
      if (!result) {
        return new CouldNotFindError()
      }
      return result.map(resultToWallet)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findById,
    findByWalletName,
    findByAddress,
    listByAddresses,
  }
}

const resultToWallet = (result: UserType): Wallet => {
  const walletId = result.id as WalletId

  const walletName = result.username ? (result.username as WalletName) : null

  const depositFeeRatio = result.depositFeeRatio as DepositFeeRatio
  const withdrawFee = result.withdrawFee as WithdrawFee

  const onChainAddressIdentifiers = result.onchain
    ? result.onchain.map(({ pubkey, address }) => {
        return {
          pubkey: pubkey as Pubkey,
          address: address as OnChainAddress,
        }
      })
    : []
  const onChainAddresses = () => onChainAddressIdentifiers.map(({ address }) => address)

  return {
    id: walletId,
    depositFeeRatio,
    withdrawFee,
    walletName,
    onChainAddressIdentifiers,
    onChainAddresses,
  }
}
