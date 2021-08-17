import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"

export const WalletsRepository = (): IWalletsRepository => {
  const findById = async (walletId: WalletId): Promise<Wallet | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: walletId })
      if (!result) {
        return new CouldNotFindError()
      }
      const onChainAddressIdentifiers = result.onchain.map(({ pubkey, address }) => {
        return {
          pubkey: pubkey as Pubkey,
          address: address as OnChainAddress,
        }
      })
      const onChainAddresses = onChainAddressIdentifiers.map(({ address }) => address)

      return { id: walletId, onChainAddresses, onChainAddressIdentifiers }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findById,
  }
}
