import { getAccountsConfig } from "@config"

import { CouldNotFindError } from "@domain/errors"
import { NoAccountCustomFieldsError } from "@domain/accounts"

import { AccountCustomFieldsRepository, AccountsRepository } from "@services/mongoose"

const { customFields: customFieldsSchema } = getAccountsConfig()

export const updateAccountCustomFields = async ({
  accountId,
  updatedByUserId,
  customFields,
}: {
  accountId: AccountId
  updatedByUserId: UserId
  customFields: { [k: string]: AccountCustomFieldValues }
}): Promise<AccountCustomFields | ApplicationError> => {
  if (!customFieldsSchema || customFieldsSchema.length <= 0)
    return new NoAccountCustomFieldsError()

  const accountCustomFieldsRepo = AccountCustomFieldsRepository()

  const account = await AccountsRepository().findById(accountId)
  if (account instanceof Error) return account

  const accountCustomFields = await accountCustomFieldsRepo.findById(account.id)
  if (accountCustomFields instanceof CouldNotFindError) {
    return accountCustomFieldsRepo.persistNew({
      accountId: account.id,
      updatedByUserId,
      customFields,
    })
  }
  if (accountCustomFields instanceof Error) return accountCustomFields

  accountCustomFields.updatedByUserId = updatedByUserId
  accountCustomFields.customFields = {
    ...accountCustomFields.customFields,
    ...customFields,
  }

  return accountCustomFieldsRepo.update(accountCustomFields)
}
