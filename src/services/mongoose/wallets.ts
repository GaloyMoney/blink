import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"
import { caseInsensitiveRegex } from "./users"

export const WalletsRepository = (): IWalletsRepository => {
  const persistNewOnChainAddress = async (
    walletId: WalletId,
    onChainAddress: OnChainAddressIdentifier,
  ): Promise<OnChainAddressIdentifier | RepositoryError> => {
    try {
      const { address, pubkey } = onChainAddress
      const result = await User.updateOne(
        { _id: walletId },
        { $push: { onchain: { address, pubkey } } },
      )

      if (result.nModified !== 1) {
        return new RepositoryError("Couldn't add onchain address for wallet")
      }

      return onChainAddress
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

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
    persistNewOnChainAddress,
    findById,
    findByWalletName,
    listByAddresses,
  }
}

const resultToWallet = (result: UserType): Wallet => {
  const walletId = result.id as WalletId

  const walletName = result.username ? (result.username as WalletName) : null

  const depositFeeRatio = result.depositFeeRatio as DepositFeeRatio

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
    walletName,
    onChainAddressIdentifiers,
    onChainAddresses,
  }
}
