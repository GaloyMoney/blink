import { AccountCustomFieldsUpdateError } from "@domain/accounts"
import {
  CouldNotFindError,
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
      }).sort({ createdAt: -1 })
      if (!result) return new CouldNotFindError()

      return translateToAccountCustomFields(result)
    } catch (err) {
      return new UnknownRepositoryError(err.message || err)
    }
  }

  const listAccountIdsByCustomField = async ({
    field,
    value,
  }: listAccountIdsByCustomFieldArgs): Promise<AccountId[] | RepositoryError> => {
    try {
      const result = await AccountCustomFields.aggregate()
        .addFields({ filterField: { $toString: `$customFields.${field}` } })
        .match({
          filterField: { $regex: new RegExp("^" + `${value}`.toLowerCase(), "i") },
        })
        .sort({ accountId: 1, createdAt: -1 })
        .group({ _id: "$accountId", createdAt: { $first: "$createdAt" } })

      if (!result || result.length === 0) return new CouldNotFindError()

      return result.map((r) => r._id as AccountId)
    } catch (err) {
      return new UnknownRepositoryError(err.message || err)
    }
  }

  const persistNew = async ({
    accountId,
    modifiedByUserId,
    customFields,
  }: PersistNewCustomFieldsArgs): Promise<AccountCustomFields | RepositoryError> => {
    try {
      const result = await AccountCustomFields.create({
        accountId: toObjectId<AccountId>(accountId),
        modifiedByUserId: toObjectId(modifiedByUserId),
        customFields,
      })

      if (!result) return new AccountCustomFieldsUpdateError()

      return translateToAccountCustomFields(result)
    } catch (err) {
      return new UnknownRepositoryError(err.message || err)
    }
  }

  return { findById, listAccountIdsByCustomField, persistNew }
}

const translateToAccountCustomFields = (
  result: AccountCustomFieldsRecord,
): AccountCustomFields => ({
  accountId: fromObjectId<AccountId>(result.accountId),
  customFields: result.customFields,
  modifiedByUserId: fromObjectId<UserId>(result.modifiedByUserId),
  createdAt: new Date(result.createdAt),
})
