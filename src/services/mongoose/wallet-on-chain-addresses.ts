import { Types as MongooseTypes } from "mongoose"
import { User } from "@services/mongoose/schema"
import {
  CouldNotFindError,
  PersistError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"

export const WalletOnChainAddressesRepository = (): IWalletOnChainAddressesRepository => {
  const persistNew = async (
    walletId: WalletId,
    onChainAddress: OnChainAddressIdentifier,
  ): Promise<OnChainAddressIdentifier | RepositoryError> => {
    try {
      const { address, pubkey } = onChainAddress
      const result = await User.updateOne(
        { _id: walletId },
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

  const findLastByWalletId = async (
    walletId: WalletId,
  ): Promise<OnChainAddressIdentifier | RepositoryError> => {
    try {
      const [result] = await User.aggregate([
        { $match: { _id: new MongooseTypes.ObjectId(walletId) } },
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
      return new UnknownRepositoryError(err)
    }
  }

  return {
    persistNew,
    findLastByWalletId,
  }
}
