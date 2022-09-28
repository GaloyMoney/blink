import {
  CouldNotFindWalletFromIdError,
  CouldNotFindWalletFromOnChainAddressError,
  CouldNotFindWalletFromOnChainAddressesError,
  CouldNotListWalletsFromAccountIdError,
  CouldNotListWalletsFromWalletCurrencyError,
  RepositoryError,
} from "@domain/errors"
import { Types } from "mongoose"

import { toObjectId, fromObjectId, parseRepositoryError } from "./utils"
import { Wallet } from "./schema"
import { AccountsRepository } from "./accounts"

export interface WalletRecord {
  id: string
  _accountId: Types.ObjectId
  type: string
  currency: string
  onchain: OnChainMongooseType[]
}

export const WalletsRepository = (): IWalletsRepository => {
  const persistNew = async ({
    accountId,
    type,
    currency,
  }: NewWalletInfo): Promise<Wallet | RepositoryError> => {
    const account = await AccountsRepository().findById(accountId)
    // verify that the account exist
    if (account instanceof Error) return account

    try {
      const wallet = new Wallet({
        _accountId: toObjectId<AccountId>(accountId),
        type,
        currency,
      })
      await wallet.save()
      return resultToWallet(wallet)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findById = async (walletId: WalletId): Promise<Wallet | RepositoryError> => {
    try {
      const result: WalletRecord | null = await Wallet.findOne({ id: walletId })
      if (!result) {
        return new CouldNotFindWalletFromIdError()
      }
      return resultToWallet(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const listByAccountId = async (
    accountId: AccountId,
  ): Promise<Wallet[] | RepositoryError> => {
    try {
      const result: WalletRecord[] = await Wallet.find({
        _accountId: toObjectId<AccountId>(accountId),
      })
      if (!result || result.length === 0) {
        return new CouldNotListWalletsFromAccountIdError()
      }
      return result.map(resultToWallet)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findByAddress = async (
    address: OnChainAddress,
  ): Promise<Wallet | RepositoryError> => {
    try {
      const result: WalletRecord | null = await Wallet.findOne({
        "onchain.address": address,
      })
      if (!result) {
        return new CouldNotFindWalletFromOnChainAddressError()
      }
      return resultToWallet(result)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const listByAddresses = async (
    addresses: OnChainAddress[],
  ): Promise<Wallet[] | RepositoryError> => {
    try {
      const result: WalletRecord[] = await Wallet.find({
        "onchain.address": { $in: addresses },
      })
      if (!result || result.length === 0) {
        return new CouldNotFindWalletFromOnChainAddressesError()
      }
      return result.map(resultToWallet)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }
  // TODO: future performance improvement might be needed
  // add pagination for instance which would have millions of wallets
  const listByWalletCurrency = async (
    walletCurrency: WalletCurrency,
  ): Promise<Wallet[] | RepositoryError> => {
    try {
      const result = await Wallet.find({ currency: walletCurrency })
      if (!result) {
        return new CouldNotListWalletsFromWalletCurrencyError()
      }
      return result.map(resultToWallet)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  return {
    findById,
    listByAccountId,
    findByAddress,
    listByAddresses,
    persistNew,
    listByWalletCurrency,
  }
}

const resultToWallet = (result: WalletRecord): Wallet => {
  const id = result.id as WalletId
  const accountId = fromObjectId<AccountId>(result._accountId)
  const type = result.type as WalletType
  const currency = result.currency as WalletCurrency
  const onChain = result.onchain || []
  const onChainAddressIdentifiers = onChain.map(({ pubkey, address }) => {
    return {
      pubkey: pubkey as Pubkey,
      address: address as OnChainAddress,
    }
  })
  const onChainAddresses = () => onChainAddressIdentifiers.map(({ address }) => address)

  return {
    id,
    accountId,
    type,
    onChainAddressIdentifiers,
    onChainAddresses,
    currency,
  }
}
