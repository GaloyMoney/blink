import {
  CouldNotFindError,
  PersistError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import { baseLogger } from "@services/logger"
import { Wallet } from "@services/mongoose/schema"

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
      return new UnknownRepositoryError(err)
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
        pubkey: result.lastAddress.pubkey as Pubkey,
        address: result.lastAddress.address as OnChainAddress,
      }
    } catch (err) {
      baseLogger.warn({ err }, "issue findLastByWalletId")
      return new UnknownRepositoryError(err)
    }
  }

  return {
    persistNew,
    findLastByWalletId,
  }
}
