import { ValidationError } from "@domain/errors"
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
  const account = await repo.findById(accountId)
  if (account instanceof Error) {
    return account
  }

  const contact = account.contacts.find((contact) => contact.username === username)
  if (!contact) {
    return new ValidationError(`User doesn't have contact ${username}`)
  }
  contact.alias = alias as ContactAlias

  const result = await repo.update(account)
  if (result instanceof Error) {
    return result
  }

  return contact
}
