import { AccountsRepository } from "./accounts"

import { Wallet } from "./schema"

import { parseRepositoryError } from "./utils"

import { WalletCurrency } from "@/domain/shared"
import { toWalletDescriptor } from "@/domain/wallets"
import {
  CouldNotFindWalletFromAccountUuidAndCurrencyError,
  CouldNotFindWalletFromIdError,
  CouldNotFindWalletFromOnChainAddressError,
  CouldNotFindWalletFromOnChainAddressesError,
  CouldNotListWalletsFromAccountUuidError,
  CouldNotListWalletsFromWalletCurrencyError,
  MultipleWalletsFoundForAccountUuidAndCurrency,
} from "@/domain/errors"

export interface WalletRecord {
  id: string
  accountUuid: string
  type: string
  currency: string
  onchain: OnChainMongooseType[]
}

export const WalletsRepository = (): IWalletsRepository => {
  const persistNew = async ({
    accountUuid,
    type,
    currency,
  }: NewWalletInfo): Promise<Wallet | RepositoryError> => {
    const account = await AccountsRepository().findByUuid(accountUuid)
    // verify that the account exist
    if (account instanceof Error) return account

    try {
      const wallet = new Wallet({
        accountUuid,
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

  const listByAccountUuid = async (
    accountUuid: AccountUuid,
  ): Promise<Wallet[] | RepositoryError> => {
    try {
      const result: WalletRecord[] = await Wallet.find({
        accountUuid: accountUuid,
      })
      if (!result || result.length === 0) {
        return new CouldNotListWalletsFromAccountUuidError(`accountUuid: ${accountUuid}}`)
      }
      return result.map(resultToWallet)
    } catch (err) {
      return parseRepositoryError(err)
    }
  }

  const findAccountWalletsByAccountUuid = async (
    accountUuid: AccountUuid,
  ): Promise<AccountWalletDescriptors | RepositoryError> => {
    const wallets = await listByAccountUuid(accountUuid)
    if (wallets instanceof Error) return wallets

    const btcWallets = wallets.filter((wallet) => wallet.currency === WalletCurrency.Btc)
    if (btcWallets.length === 0) {
      return new CouldNotFindWalletFromAccountUuidAndCurrencyError(WalletCurrency.Btc)
    }
    if (btcWallets.length > 1) {
      return new MultipleWalletsFoundForAccountUuidAndCurrency(WalletCurrency.Btc)
    }
    const btcWallet = btcWallets[0]

    const usdWallets = wallets.filter((wallet) => wallet.currency === WalletCurrency.Usd)
    if (usdWallets.length === 0) {
      return new CouldNotFindWalletFromAccountUuidAndCurrencyError(WalletCurrency.Usd)
    }
    if (usdWallets.length > 1) {
      return new MultipleWalletsFoundForAccountUuidAndCurrency(WalletCurrency.Usd)
    }
    const usdWallet = usdWallets[0]

    return {
      [WalletCurrency.Btc]: toWalletDescriptor(btcWallet),
      [WalletCurrency.Usd]: toWalletDescriptor(usdWallet),
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
    listByAccountUuid,
    findAccountWalletsByAccountUuid,
    findByAddress,
    listByAddresses,
    persistNew,
    listByWalletCurrency,
  }
}

const resultToWallet = (result: WalletRecord): Wallet => {
  const id = result.id as WalletId
  const accountUuid = result.accountUuid as AccountUuid
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
    accountUuid,
    type,
    onChainAddressIdentifiers,
    onChainAddresses,
    currency,
  }
}
