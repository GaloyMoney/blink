import { getAccountsConfig } from "@config"

import { CouldNotFindError } from "@domain/errors"
import { NoAccountCustomFieldsError } from "@domain/accounts"

import { AccountCustomFieldsRepository, AccountsRepository } from "@services/mongoose"

const { customFields: customFieldsSchema } = getAccountsConfig()

const defaultValues = customFieldsSchema.reduce((acc, val) => {
  if (val.defaultValue !== undefined) {
    acc[val.name] = val.defaultValue
  }
  return acc
}, {} as { [k: string]: AccountCustomFieldValues })

export const updateAccountCustomFields = async ({
  accountId,
  modifiedByUserId,
  customFields,
}: {
  accountId: AccountId
  modifiedByUserId: UserId
  customFields: { [k: string]: AccountCustomFieldValues }
}): Promise<AccountCustomFields | ApplicationError> => {
  if (!customFieldsSchema || customFieldsSchema.length <= 0)
    return new NoAccountCustomFieldsError()

  const accountCustomFieldsRepo = AccountCustomFieldsRepository()

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  const accountCustomFields = await accountCustomFieldsRepo.findById(account.id)
  const isEmpty = accountCustomFields instanceof CouldNotFindError
  if (accountCustomFields instanceof Error && !isEmpty) return accountCustomFields

  let data = customFields
  if (!isEmpty) {
    data = { ...accountCustomFields.customFields, ...customFields }
  }

  return accountCustomFieldsRepo.persistNew({
    accountId: account.id,
    modifiedByUserId,
    customFields: { ...defaultValues, ...data },
  })
}
