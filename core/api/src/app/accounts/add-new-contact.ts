import { AccountsRepository } from "@services/mongoose"

export const addNewContact = async ({
  accountId,
  contactUsername,
}: {
  accountId: AccountId
  contactUsername: Username
}): Promise<Account | ApplicationError> => {
  const accountsRepo = AccountsRepository()

  const contactAccount = await accountsRepo.findByUsername(contactUsername)
  if (contactAccount instanceof Error) return contactAccount

  const account = await accountsRepo.findById(accountId)
  if (account instanceof Error) return account

  const idx = account.contacts.findIndex(
    (userContact) => userContact.username === contactUsername,
  )
  if (idx >= 0) {
    account.contacts[idx].transactionsCount++
  } else {
    account.contacts.push({
      id: contactUsername,
      username: contactUsername,
      alias: "" as ContactAlias,
      transactionsCount: 1,
    })
  }
  const updateResult = await accountsRepo.update(account)
  if (updateResult instanceof Error) return updateResult

  return account
}
