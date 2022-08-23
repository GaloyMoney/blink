import { AccountCustomFieldsUpdateError } from "@domain/accounts"
import {
  CouldNotFindError,
  PersistError,
  RepositoryError,
  UnknownRepositoryError,
} from "@domain/errors"

import { AccountCustomFields } from "./schema"
import { toObjectId, fromObjectId } from "./utils"

export const AccountCustomFieldsRepository = (): IAccountCustomFieldsRepository => {
  const findById = async (
    accountId: AccountId,
  ): Promise<AccountCustomFields | RepositoryError> => {
    try {
      const result = await AccountCustomFields.findOne({
        accountId: toObjectId<AccountId>(accountId),
      })
      if (!result) return new CouldNotFindError()

      return translateToAccountCustomFields(result)
    } catch (err) {
      return new UnknownRepositoryError(err.message || err)
    }
  }

  const listByCustomField = async ({
    field,
    value,
  }: ListByCustomFieldArgs): Promise<AccountCustomFields[] | RepositoryError> => {
    try {
      const result = await AccountCustomFields.find({
        $expr: {
          $regexMatch: {
            input: { $toString: `$customFields.${field}` },
            regex: new RegExp("^" + `${value}`.toLowerCase(), "i"),
          },
        },
      })

      if (!result || result.length === 0) return new CouldNotFindError()

      return result.map(translateToAccountCustomFields)
    } catch (err) {
      return new UnknownRepositoryError(err.message || err)
    }
  }

  const persistNew = async ({
    accountId,
    updatedByUserId,
    customFields,
  }: PersistNewCustomFieldsArgs): Promise<AccountCustomFields | RepositoryError> => {
    try {
      const result = await AccountCustomFields.create({
        accountId: toObjectId<AccountId>(accountId),
        updatedByUserId: toObjectId(updatedByUserId),
        customFields,
      })

      if (!result) return new AccountCustomFieldsUpdateError()

      return translateToAccountCustomFields(result)
    } catch (err) {
      return new UnknownRepositoryError(err.message || err)
    }
  }

  const update = async (
    accountCustomFields: AccountCustomFields,
  ): Promise<AccountCustomFields | RepositoryError> => {
    try {
      const { accountId, ...toUpdate } = accountCustomFields
      const result = await AccountCustomFields.updateOne(
        { accountId: toObjectId<AccountId>(accountId) },
        { $set: { ...toUpdate, updatedAt: new Date() } },
      )

      if (!result) return new AccountCustomFieldsUpdateError()

      if (result.matchedCount === 0) {
        return new CouldNotFindError("Couldn't find user")
      }

      if (result.modifiedCount !== 1) {
        return new PersistError("Couldn't update ip for user")
      }

      return accountCustomFields
    } catch (err) {
      return new UnknownRepositoryError(err.message || err)
    }
  }

  return { findById, listByCustomField, persistNew, update }
}

const translateToAccountCustomFields = (
  result: AccountCustomFieldsRecord,
): AccountCustomFields => ({
  accountId: fromObjectId<AccountId>(result.accountId),
  customFields: result.customFields,
  updatedByUserId: fromObjectId<UserId>(result.updatedByUserId),
  createdAt: new Date(result.createdAt),
  updatedAt: new Date(result.updatedAt),
})
