import {
  CouldNotFindError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"
import { AccountApiKey } from "./schema"

export const AccountApiKeysRepository = (): IAccountApiKeysRepository => {
  const findByHashedKey = async (
    hashedKey: HashedKey,
  ): Promise<AccountApiKey | RepositoryError> => {
    try {
      const apiKey = await AccountApiKey.findOne({
        hashedKey,
        expireAt: { $gt: new Date(Date.now()) },
        enabled: true,
      })
      if (!apiKey) {
        return new CouldNotFindError("Couldn't find a valid apiKey for hashed key")
      }
      return translateToAccountApiKey(apiKey)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const listByAccountId = async (
    accountId: AccountId,
  ): Promise<AccountApiKey[] | RepositoryError> => {
    try {
      const result = await AccountApiKey.find({
        accountId,
        expireAt: { $gt: new Date(Date.now()) },
        enabled: true,
      })
      if (!result || !result.length) {
        return new CouldNotFindError()
      }
      return result.map(translateToAccountApiKey)
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const persistNew = async (
    accountId: AccountId,
    label: string,
    hashedKey: HashedKey,
    expireAt: Date,
  ): Promise<AccountApiKey | RepositoryError> => {
    try {
      await new AccountApiKey({
        accountId,
        label,
        hashedKey,
        expireAt,
        enabled: true,
      }).save()
      return {
        accountId,
        label,
        hashedKey,
        expireAt,
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  const disableByLabel = async (
    accountId: AccountId,
    label: string,
  ): Promise<void | RepositoryError> => {
    try {
      const data = { enabled: false }
      const doc = await AccountApiKey.updateOne({ accountId, label }, { $set: data })
      if (doc.nModified !== 1) {
        return new RepositoryError("Couldn't disable api key")
      }
    } catch (err) {
      return new UnknownRepositoryError(err)
    }
  }

  return {
    findByHashedKey,
    listByAccountId,
    persistNew,
    disableByLabel,
  }
}

const translateToAccountApiKey = (apiKey): AccountApiKey => ({
  accountId: apiKey.accountId,
  label: apiKey.label,
  hashedKey: apiKey.hashedKey,
  expireAt: apiKey.expireAt,
})
