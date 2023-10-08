import { checkedToAccountUuid, checkedToContactAlias } from "@/domain/accounts"
import { ContactNotExistentError } from "@/domain/errors"
import { AccountsRepository } from "@/services/mongoose"

export const updateContactAlias = async ({
  accountUuid: accountUuidRaw,
  username,
  alias,
}: {
  accountUuid: string
  username: string
  alias: string
}): Promise<AccountContact | ApplicationError> => {
  const accountUuid = checkedToAccountUuid(accountUuidRaw)
  if (accountUuid instanceof Error) return accountUuid

  const repo = AccountsRepository()

  const aliasChecked = checkedToContactAlias(alias)
  if (aliasChecked instanceof Error) return aliasChecked

  const account = await repo.findByUuid(accountUuid)
  if (account instanceof Error) {
    return account
  }

  const contact = account.contacts.find((contact) => contact.username === username)
  if (!contact) {
    return new ContactNotExistentError()
  }

  contact.alias = aliasChecked

  const result = await repo.update(account)
  if (result instanceof Error) {
    return result
  }

  return contact
}
