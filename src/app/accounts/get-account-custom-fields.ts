import { getAccountsConfig } from "@config"

import { NoAccountCustomFieldsError } from "@domain/accounts"

import { AccountCustomFieldsRepository } from "@services/mongoose"

const { customFields: customFieldsSchema } = getAccountsConfig()

const defaultValues = customFieldsSchema.reduce((acc, val) => {
  if (val.defaultValue !== undefined) {
    acc[val.name] = val.defaultValue
  }
  return acc
}, {} as { [k: string]: AccountCustomFieldValues })

export const getAccountCustomFields = async (
  accountId: AccountId,
): Promise<AccountCustomFields | ApplicationError> => {
  if (!customFieldsSchema || customFieldsSchema.length <= 0)
    return new NoAccountCustomFieldsError()

  const result = await AccountCustomFieldsRepository().findById(accountId)
  if (result instanceof Error) return result

  result.customFields = { ...defaultValues, ...result.customFields }

  return result
}
