import { getAccountsConfig } from "@config"

import { InvalidCustomFieldError } from "@domain/accounts"

import { AccountCustomFieldsRepository, AccountsRepository } from "@services/mongoose"

const { customFields: customFieldsSchema } = getAccountsConfig()

export const getAccountsByCustomFields = async ({
  field,
  value,
}: {
  field: string
  value: string
}): Promise<Account[] | ApplicationError> => {
  const fieldSchema = customFieldsSchema.find((s) => s.name === field)
  if (!fieldSchema) return new InvalidCustomFieldError()

  const customAccountFields = await AccountCustomFieldsRepository().listByCustomField({
    field,
    value,
  })
  if (customAccountFields instanceof Error) return customAccountFields

  const accountIds = customAccountFields.map((f) => f.accountId)
  return AccountsRepository().listByIds(accountIds)
}
