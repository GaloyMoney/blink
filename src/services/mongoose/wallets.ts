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

  const findByWalletname = async (
    username: Walletname,
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

  return {
    findById,
    findByWalletname,
  }
}

const resultToWallet = (result: UserType): Wallet => {
  const walletId = result.id as WalletId

  const walletname: Walletname = result.username
    ? (result.username as Walletname)
    : ("" as Walletname)

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
    walletname,
    onChainAddressIdentifiers,
    onChainAddresses,
  }
}
