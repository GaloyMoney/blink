import {
  UnknownRepositoryError,
  CouldNotFindError,
  RepositoryError,
} from "@domain/errors"
import { User } from "@services/mongoose/schema"

export const MakeWallets = (): IWallets => {
  const findById = async (walletId: WalletId): Promise<Wallet | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: walletId })
      if (!result) {
        return new CouldNotFindError()
      }
      const onChainAddressIdentifiers = result.onchain.map(({ pubkey, address }) => {
        return {
          onChainAddresses: {
            pubkey: pubkey as Pubkey,
            address: address as OnChainAddress,
          },
        }
      }) as OnChainAddressIdentifier[]
      const onChainAddresses = onChainAddressIdentifiers.map(
        ({ address }) => address,
      ) as OnChainAddress[]

      return { onChainAddresses, onChainAddressIdentifiers }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findById,
  }
}
