import { UnknownRepositoryError, CouldNotFindError } from "@domain/errors"
import { User } from "@services/mongoose/schema"

export const MakeWallets = (): IWallets => {
  const getOnchainAddressesFor = async (
    walletId: WalletId,
  ): Promise<AddressIdentifier[] | RepositoryError> => {
    try {
      const result = await User.findOne({ _id: walletId })
      if (!result) {
        return new CouldNotFindError()
      }
      return result.onchain.map(({ pubkey, address }) => {
        return { pubkey: pubkey as Pubkey, address: address as OnchainAddress }
      })
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }
  return {
    getOnchainAddressesFor,
  }
}
