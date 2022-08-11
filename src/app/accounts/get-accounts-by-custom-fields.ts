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

  const accountIds = await AccountCustomFieldsRepository().listAccountIdsByCustomField({
    field,
    value,
  })
  if (accountIds instanceof Error) return accountIds

  return AccountsRepository().listByIds(accountIds)
}
