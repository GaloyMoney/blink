import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"

export const WalletsRepository = (): IWalletsRepository => {
  const update = async (wallet: Wallet): Promise<Wallet | RepositoryError> => {
    try {
      const result = await User.findOneAndUpdate(
        { _id: wallet.id },
        {
          onchain: wallet.onChainAddressIdentifiers,
        },
      )
      if (!result) {
        return new CouldNotFindError()
      }

      return wallet
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
      const onChainAddressIdentifiers = result.onchain.map(({ pubkey, address }) => {
        return {
          pubkey: pubkey as Pubkey,
          address: address as OnChainAddress,
        }
      })
      const onChainAddresses = () =>
        onChainAddressIdentifiers.map(({ address }) => address)

      return {
        id: walletId,
        depositFeeRatio: result.depositFeeRatio,
        onChainAddresses,
        onChainAddressIdentifiers,
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    update,
    findById,
  }
}
