import {
  CouldNotFindError,
  PersistError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import { baseLogger } from "@services/logger"
import { User } from "@services/mongoose/schema"

export const WalletOnChainAddressesRepository = (): IWalletOnChainAddressesRepository => {
  const persistNew = async (
    id: WalletId,
    onChainAddress: OnChainAddressIdentifier,
  ): Promise<OnChainAddressIdentifier | RepositoryError> => {
    const oldPersistNew = async () => {
      try {
        const { address, pubkey } = onChainAddress
        const result = await User.updateOne(
          { walletId: id },
          { $push: { onchain: { address, pubkey } } },
        )

        if (result.n === 0) {
          return new CouldNotFindError("Couldn't find wallet")
        }

        if (result.nModified !== 1) {
          return new PersistError("Couldn't add onchain address for wallet")
        }

        return onChainAddress
      } catch (err) {
        return new UnknownRepositoryError(err)
      }
    }
    try {
      const { address, pubkey } = onChainAddress
      const result = await User.updateOne(
        { defaultWalletId: id },
        { $push: { onchain: { address, pubkey } } },
      )

      if (result.n === 0) {
        return oldPersistNew()
      }

      if (result.nModified !== 1) {
        return oldPersistNew()
      }

      return onChainAddress
    } catch (err) {
      return oldPersistNew()
    }
  }

  const findLastByWalletId = async (
    id: WalletId,
  ): Promise<OnChainAddressIdentifier | RepositoryError> => {
    const oldFindByLastWalletId = async () => {
      try {
        const [result] = await User.aggregate([
          { $match: { walletId: id } },
          { $project: { lastAddress: { $last: "$onchain" } } },
        ])

        if (!result || !result.lastAddress) {
          return new CouldNotFindError("Couldn't find address for wallet")
        }

        return {
          pubkey: result.lastAddress.pubkey as Pubkey,
          address: result.lastAddress.address as OnChainAddress,
        }
      } catch (err) {
        baseLogger.warn({ err }, "issue findLastByWalletId")
        return new UnknownRepositoryError(err)
      }
    }
    try {
      const [result] = await User.aggregate([
        { $match: { defaultWalletId: id } },
        { $project: { lastAddress: { $last: "$onchain" } } },
      ])

      if (!result || !result.lastAddress) {
        return oldFindByLastWalletId()
      }

      return {
        pubkey: result.lastAddress.pubkey as Pubkey,
        address: result.lastAddress.address as OnChainAddress,
      }
    } catch (err) {
      baseLogger.warn({ err }, "issue findLastByWalletId")
      return oldFindByLastWalletId()
    }
  }

  return {
    persistNew,
    findLastByWalletId,
  }
}
