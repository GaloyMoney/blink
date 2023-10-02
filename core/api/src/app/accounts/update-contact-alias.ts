import { checkedToContactAlias } from "@domain/accounts"
import { ContactNotExistentError } from "@domain/errors"
import { AccountsRepository } from "@services/mongoose"

export const updateContactAlias = async ({
  accountId,
  username,
  alias,
}: {
  accountId: AccountId
  username: string
  alias: string
}): Promise<AccountContact | ApplicationError> => {
  const repo = AccountsRepository()

  const aliasChecked = checkedToContactAlias(alias)
  if (aliasChecked instanceof Error) return aliasChecked

  const account = await repo.findById(accountId)
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
