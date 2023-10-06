import { parseRepositoryError } from "./utils"

import { CouldNotFindError, PersistError, RepositoryError } from "@/domain/errors"
import { baseLogger } from "@/services/logger"
import { Wallet } from "@/services/mongoose/schema"

export const WalletOnChainAddressesRepository = (): IWalletOnChainAddressesRepository => {
  const persistNew = async ({
    walletId,
    onChainAddress,
  }: {
    walletId: WalletId
    onChainAddress: OnChainAddressIdentifier
  }): Promise<OnChainAddressIdentifier | RepositoryError> => {
    try {
      const { address, pubkey } = onChainAddress

      const result = await Wallet.updateOne(
        { id: walletId },
        { $push: { onchain: { address, pubkey } } },
      )

      if (result.matchedCount === 0) {
        return new CouldNotFindError("Couldn't find wallet")
      }

      if (result.modifiedCount !== 1) {
        return new PersistError("Couldn't add onchain address for wallet")
      }

      return onChainAddress
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findLastByWalletId = async (
    id: WalletId,
  ): Promise<OnChainAddressIdentifier | RepositoryError> => {
    try {
      const [result] = await Wallet.aggregate([
        { $match: { id } },
        { $project: { lastAddress: { $last: "$onchain" } } },
      ])

      if (!result || !result.lastAddress) {
        return new CouldNotFindError("Couldn't find address for wallet")
      }

      return {
        pubkey: result.lastAddress.pubkey,
        address: result.lastAddress.address,
      }
    } catch (err) {
      baseLogger.warn({ err }, "issue findLastByWalletId")
      return parseRepositoryError(err)
    }
  }

  const isRecorded = async ({
    walletId,
    onChainAddress,
  }: {
    walletId: WalletId
    onChainAddress: OnChainAddressIdentifier
  }) => {
    try {
      const result = await Wallet.countDocuments({
        id: walletId,
        onchain: {
          $elemMatch: {
            address: onChainAddress.address,
          },
        },
      })

      return result > 0
    } catch (err) {
      return parseRepositoryError(err)
    }
  }
  return {
    persistNew,
    findLastByWalletId,
    isRecorded,
  }
}
